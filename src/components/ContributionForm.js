import React, { Component } from "react";
import { injectIntl } from 'react-intl';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay"
import {
    formatMessageWithValues, formatMessage, withModulesManager, withHistory,
    Form, ProgressOrError, journalize, coreConfirm, Helmet
} from "@openimis/fe-core";
import { RIGHT_CONTRIBUTION } from "../constants";

import { fetchContribution, newContribution, createContribution, fetchPolicySummary, suspendPolicy } from "../actions";
import ContributionMasterPanel from "./ContributionMasterPanel";
import SaveContributionDialog from "./SaveContributionDialog";

const styles = theme => ({
    lockedPage: theme.page.locked
});

const CONTRIBUTION_OVERVIEW_MUTATIONS_KEY = "contribution.ContributionOverview.mutations"

class ContributionForm extends Component {
    _newContribution = () => ({
        isPhotoFee: false
    });

    state = {
        reset: 0,
        update: false,
        contribution: this._newContribution(),
        newContribution: true,
        saveContribution: false,
        familyPolicies: []
    }

    componentDidMount() {
        const {
            contribution_uuid,
            policy_uuid,
            modulesManager,
            fetchContribution,
            fetchPolicySummary,
            policies
        } = this.props;
        console.log(policies);
        if(policies.length != 0){
            let pol = policies.map((p)=> p.node);
            this.setState({
                familyPolicies: pol
            })
        }
        if (contribution_uuid) {
            this.setState(
                (state, props) => (
                    { contribution_uuid: props.contribution_uuid }
                ),
                e => fetchContribution(
                    modulesManager,
                    contribution_uuid
                )
            )
        }
        if (policy_uuid) {
            fetchPolicySummary(modulesManager, policy_uuid);
            this.setState({
                contribution: {
                    ... this._newContribution(),
                    policy: {
                        uuid: policy_uuid,
                        value: undefined,
                    },
                },
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.fetchedContribution && !!this.props.fetchedContribution) {
            const { contribution } = this.props;
            this.setState(
                {
                    contribution,
                    contribution_uuid: contribution.uuid,
                    newContribution: false
                });
        } else if (prevProps.contribution_uuid && !this.props.contribution_uuid) {
            this.setState({ contribution: this._newContribution(), newContribution: true, contribution_uuid: null });
        } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
            this.setState((state, props) => ({
                contribution: { ...state.contribution, clientMutationId: props.mutation.clientMutationId }
            }));
        } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
            this.state.confirmedAction();
        }

        if (!prevProps.policySummary && !!this.props.policySummary) {
            this.setState(prevState => ({
                contribution: {
                    ...prevState.contribution,
                    policy: this.props.policySummary,
                },
            }));
        }

        if (!prevProps.confirmed && this.props.confirmed) {
            this.state.confirmedAction && this.state.confirmedAction();
        }
    }


    reload = () => {
        const { contribution } = this.state;
        this.props.fetchContribution(
            this.props.modulesManager,
            this.state.contribution_uuid,
            contribution.clientMutationId
        );
    }

    canSave = () => {
        const { contribution } = this.state;
        if (!contribution ||
            (contribution && (
                !contribution.payDate ||
                !contribution.payType ||
                !contribution.amount ||
                !contribution.receipt ||
                !contribution.policy ||
                (contribution.policy && !contribution.policy.uuid)
            ))) return false;
        return true;
    }

    confirmSave = () => {
        let previousPolicy = null;
        let policies = this.state.familyPolicies;
        let contribution = this.state.contribution;
        for (let i = 0; i < policies.length; i++){
            if(!!policies[i].product.program && 
                (policies[i].product.program.nameProgram == "Cheque Santé" || 
                    policies[i].product.program.nameProgram == "Chèque Santé") &&
                    policies[i].status == 2 && Math.round(contribution.policy.value) == Math.round(contribution.amount)){
                    previousPolicy = this.state.familyPolicies[i];
                }
        }
        if(previousPolicy != null){
            this.setState({
                saveContribution: false
              })
            this.confirmActivePolicy(previousPolicy)
        }else{
            this.setState(
                { saveContribution: true },
            );
        }
        
    }

    confirmActivePolicy = (previousPolicy) => {
        let confirmedAction = () => {
            this.props.suspendPolicy(this.props.modulesManager, previousPolicy, formatMessageWithValues(
                this.props.intl,
                "policy",
                "SuspendPolicy.mutationLabel",
                {
                    policy: previousPolicy.uuid
                }
            ));
    
            this.setState(prevState => {
                const { contribution } = prevState;
                this.props.save(contribution);
                return (
                    {
                        saveContribution: false,
                    }
                );
            },);
        }
    
        let confirm = e => {
          this.props.coreConfirm(
            formatMessage(this.props.intl, "policy", "confirmActivePolicy.title"),
            formatMessageWithValues(this.props.intl, "policy","confirmActivePolicy.message",{label: previousPolicy.product.name,}),
          );
        }
        this.setState(
          { confirmedAction },
          confirm
        )
      }

    _save = (action) => {
        this.setState(prevState => {
            const { contribution } = prevState;
            if (!!action) {
                contribution.action = action;
            }
            this.props.save(contribution);
            return (
                {
                    saveContribution: false,
                }
            );
        },
        );
    }

    onEditedChanged = contribution => {
        this.setState({ contribution, newContribution: false })
    }

    onActionToConfirm = (title, message, confirmedAction) => {
        this.setState(
            { confirmedAction },
            this.props.coreConfirm(
                title,
                message
            )
        )
    }

    _cancelSave() {
        const { update } = this.state;
        this.setState(
            {
                saveContribution: false,
                update: !update,
            },
        );
    }

    render() {
        const {
            modulesManager,
            classes,
            state,
            rights,
            contribution_uuid,
            fetchingContribution,
            fetchedContribution,
            errorContribution,
            overview = false,
            readOnly = false,
            save,
            back,
        } = this.props;
        const { contribution, saveContribution, newContribution, reset, update } = this.state;
        if (!rights.includes(RIGHT_CONTRIBUTION)) return null;
        let runningMutation = !!contribution && !!contribution.clientMutationId
        let contributedMutations = modulesManager.getContribs(CONTRIBUTION_OVERVIEW_MUTATIONS_KEY);
        for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
            runningMutation = contributedMutations[i](state)
        }
        const actions = [{
            doIt: this.reload,
            icon: <ReplayIcon />,
            onlyIfDirty: !readOnly && !runningMutation
        }];
        return (
            <div className={!!runningMutation ? classes.lockedPage : null}>
                <Helmet title={formatMessageWithValues(this.props.intl, "contribution", "ContributionOverview.title")} />
                <SaveContributionDialog
                    contribution={saveContribution && contribution}
                    onConfirm={this._save}
                    onCancel={() => this._cancelSave()} />
                <ProgressOrError progress={fetchingContribution} error={errorContribution} />
                {((!!fetchedContribution && !!contribution && contribution.uuid === contribution_uuid) || !contribution_uuid) && (
                    <Form
                        module="contribution"
                        title={!!newContribution ? "ContributionOverview.newTitle" : "ContributionOverview.title"}
                        edited_id={contribution_uuid}
                        edited={contribution}
                        reset={reset}
                        back={back}
                        // add={!!add && !newContribution ? this._add : null}
                        readOnly={readOnly || runningMutation || contribution && !!contribution.validityTo}
                        actions={actions}
                        overview={overview}
                        HeadPanel={ContributionMasterPanel}
                        contribution={contribution}
                        onEditedChanged={this.onEditedChanged}
                        canSave={this.canSave}
                        save={!!save ? this.confirmSave : null}
                        update={update}
                        onActionToConfirm={this.onActionToConfirm}
                    />
                )}
            </div>
        )
    }
}

const mapStateToProps = (state, props) => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    fetchingContribution: state.contribution.fetchingContribution,
    errorContribution: state.contribution.errorContribution,
    fetchedContribution: state.contribution.fetchedContribution,
    submittingMutation: state.contribution.submittingMutation,
    policySummary: state.contribution.policySummary,
    mutation: state.contribution.mutation,
    contribution: state.contribution.contribution,
    confirmed: state.core.confirmed,
    policies: !!state.insuree && !!state.insuree.family && !!state.insuree.family.policies ? state.insuree.family.policies.edges : [],
    state: state,
})

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        fetchContribution,
        fetchPolicySummary,
        newContribution,
        createContribution,
        suspendPolicy,
        journalize,
        coreConfirm,
    }, dispatch);
};

export default withHistory(withModulesManager(connect(mapStateToProps, mapDispatchToProps)(
    injectIntl(withTheme(withStyles(styles)(ContributionForm))
    ))));