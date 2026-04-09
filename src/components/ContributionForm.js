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

        if (policies?.length) {
            let pol = policies.map((p) => p?.node);
            this.setState({ familyPolicies: pol });
        }

        if (contribution_uuid) {
            this.setState(
                { contribution_uuid },
                () => fetchContribution(modulesManager, contribution_uuid)
            );
        }

        if (policy_uuid) {
            fetchPolicySummary(modulesManager, policy_uuid);
            this.setState({
                contribution: {
                    ...this._newContribution(),
                    policy: {
                        uuid: policy_uuid,
                        value: undefined,
                    },
                },
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.fetchedContribution && this.props.fetchedContribution) {
            const { contribution } = this.props;
            this.setState({
                contribution,
                contribution_uuid: contribution?.uuid,
                newContribution: false
            });
        } else if (prevProps.contribution_uuid && !this.props.contribution_uuid) {
            this.setState({
                contribution: this._newContribution(),
                newContribution: true,
                contribution_uuid: null
            });
        } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
            this.setState((state, props) => ({
                contribution: {
                    ...state.contribution,
                    clientMutationId: props.mutation?.clientMutationId
                }
            }));
        } else if (prevProps.confirmed !== this.props.confirmed && this.props.confirmed && this.state.confirmedAction) {
            this.state.confirmedAction();
        }

        if (!prevProps.policySummary && this.props.policySummary) {
            this.setState(prevState => ({
                contribution: {
                    ...prevState.contribution,
                    policy: this.props.policySummary,
                },
            }));
        }
    }

    reload = () => {
        const { contribution_uuid } = this.state;
        this.props.fetchContribution(
            this.props.modulesManager,
            contribution_uuid,
            this.state.contribution?.clientMutationId
        );
    }

    canSave = () => {
        const { contribution } = this.state;
        return !!(
            contribution?.payDate &&
            contribution?.payType &&
            contribution?.amount &&
            contribution?.receipt &&
            contribution?.policy?.uuid
        );
    }

    confirmSave = () => {
        const { contribution, familyPolicies } = this.state;

        const programName = contribution?.policy?.product?.program?.nameProgram;

        const isChequeSante =
            programName === "Cheque Santé" ||
            programName === "Chèque Santé";

        if (isChequeSante) {
            let previousPolicy = null;

            for (let i = 0; i < familyPolicies.length; i++) {
                const pol = familyPolicies[i];
                const polProgram = pol?.product?.program?.nameProgram;

                const sameProgram =
                    polProgram === "Cheque Santé" ||
                    polProgram === "Chèque Santé";

                if (
                    sameProgram &&
                    pol?.status === 2 &&
                    Math.round(contribution?.policy?.value) === Math.round(contribution?.amount)
                ) {
                    previousPolicy = pol;
                    break;
                }
            }

            if (previousPolicy) {
                this.setState(prev => ({
                    saveContribution: false,
                    update: !prev.update
                }));
                this.confirmActivePolicy(previousPolicy);
            } else {
                this.setState({ saveContribution: true });
            }
        } else {
            this.setState({ saveContribution: true });
        }
    }

    confirmActivePolicy = (previousPolicy) => {
        const confirmedAction = () => {
            this.props.suspendPolicy(
                this.props.modulesManager,
                previousPolicy,
                formatMessageWithValues(
                    this.props.intl,
                    "policy",
                    "SuspendPolicy.mutationLabel",
                    { policy: previousPolicy?.uuid }
                )
            );

            this.setState(prevState => {
                this.props.save(prevState.contribution);
                return { saveContribution: false };
            });
        }

        this.setState(
            { confirmedAction },
            () => this.props.coreConfirm(
                formatMessage(this.props.intl, "policy", "confirmActivePolicy.title"),
                formatMessageWithValues(
                    this.props.intl,
                    "policy",
                    "confirmActivePolicy.message",
                    { label: previousPolicy?.product?.name }
                )
            )
        );
    }

    _save = (action) => {
        this.setState(prevState => {
            const contribution = { ...prevState.contribution };
            if (action) contribution.action = action;
            this.props.save(contribution);
            return { saveContribution: false };
        });
    }

    onEditedChanged = contribution => {
        this.setState({ contribution, newContribution: false })
    }

    onActionToConfirm = (title, message, confirmedAction) => {
        this.setState(
            { confirmedAction },
            this.props.coreConfirm(title, message)
        )
    }

    _cancelSave() {
        this.setState(prev => ({
            saveContribution: false,
            update: !prev.update,
        }));
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

        let runningMutation = !!contribution?.clientMutationId;

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
            <div className={runningMutation ? classes.lockedPage : null}>
                <Helmet title={formatMessageWithValues(this.props.intl, "contribution", "ContributionOverview.title")} />

                <SaveContributionDialog
                    contribution={saveContribution && contribution}
                    onConfirm={this._save}
                    onCancel={() => this._cancelSave()}
                />

                <ProgressOrError progress={fetchingContribution} error={errorContribution} />

                {((fetchedContribution && contribution && contribution.uuid === contribution_uuid) || !contribution_uuid) && (
                    <Form
                        module="contribution"
                        title={newContribution ? "ContributionOverview.newTitle" : "ContributionOverview.title"}
                        edited_id={contribution_uuid}
                        edited={contribution}
                        reset={reset}
                        back={back}
                        readOnly={readOnly || runningMutation || contribution?.validityTo}
                        actions={actions}
                        overview={overview}
                        HeadPanel={ContributionMasterPanel}
                        contribution={contribution}
                        onEditedChanged={this.onEditedChanged}
                        canSave={this.canSave}
                        save={save ? this.confirmSave : null}
                        update={update}
                        onActionToConfirm={this.onActionToConfirm}
                    />
                )}
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    rights: state?.core?.user?.i_user?.rights || [],
    fetchingContribution: state?.contribution?.fetchingContribution,
    errorContribution: state?.contribution?.errorContribution,
    fetchedContribution: state?.contribution?.fetchedContribution,
    submittingMutation: state?.contribution?.submittingMutation,
    policySummary: state?.contribution?.policySummary,
    mutation: state?.contribution?.mutation,
    contribution: state?.contribution?.contribution,
    confirmed: state?.core?.confirmed,
    policies: state?.insuree?.family?.policies?.edges || [],
    state: state,
})

const mapDispatchToProps = dispatch => bindActionCreators({
    fetchContribution,
    fetchPolicySummary,
    newContribution,
    createContribution,
    suspendPolicy,
    journalize,
    coreConfirm,
}, dispatch);

export default withHistory(
    withModulesManager(
        connect(mapStateToProps, mapDispatchToProps)(
            injectIntl(
                withTheme(
                    withStyles(styles)(ContributionForm)
                )
            )
        )
    )
);