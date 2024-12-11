import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import People from "@material-ui/icons/People";

import {
  formatMessageWithValues,
  formatMessage,
  historyPush,
  withModulesManager,
  withHistory,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  Helmet,
} from "@openimis/fe-core";
import {
  fetchContribution,
  newContribution,
  createContribution,
  fetchPolicySummary,
  clearContribution,
  fetchPoliciesPremiums,
} from "../actions";
import { INSUREE_FAMILY_ROUTE_REF, RIGHT_CONTRIBUTION } from "../constants";
import ContributionMasterPanel from "./ContributionMasterPanel";
import SaveContributionDialog from "./SaveContributionDialog";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

const CONTRIBUTION_OVERVIEW_MUTATIONS_KEY =
  "contribution.ContributionOverview.mutations";

class ContributionForm extends Component {
  _newContribution = () => ({
    isPhotoFee: false,
  });

  state = {
    reset: 0,
    update: false,
    contribution: this._newContribution(),
    newContribution: true,
    saveContribution: false,
  };

  componentDidMount() {
    const {
      contribution_uuid,
      policy_uuid,
      modulesManager,
      fetchContribution,
      fetchPolicySummary,
      fetchPoliciesPremiums,
    } = this.props;
    if (contribution_uuid) {
      this.setState(
        (state, props) => ({ contribution_uuid: props.contribution_uuid }),
        (e) => fetchContribution(modulesManager, contribution_uuid)
      );
    }
    if (policy_uuid) {
      fetchPolicySummary(modulesManager, [policy_uuid]);
      fetchPoliciesPremiums(modulesManager, [`policyUuids: "${policy_uuid}"`]);
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

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.fetchedContribution && !!this.props.fetchedContribution) {
      const { contribution } = this.props;
      this.setState({
        contribution,
        contribution_uuid: contribution.uuid,
        newContribution: false,
      });
    } else if (prevProps.contribution_uuid && !this.props.contribution_uuid) {
      this.setState({
        contribution: this._newContribution(),
        newContribution: true,
        contribution_uuid: null,
      });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        contribution: {
          ...state.contribution,
          clientMutationId: props.mutation.clientMutationId,
        },
      }));
    } else if (
      prevProps.confirmed !== this.props.confirmed &&
      !!this.props.confirmed &&
      !!this.state.confirmedAction
    ) {
      this.state.confirmedAction();
    }

    if (!prevProps.policySummary && !!this.props.policySummary) {
      this.setState((prevState) => ({
        contribution: {
          ...prevState.contribution,
          policy: this.props.policySummary,
        },
      }));
    }

    if (
      prevState.contribution !== this.state.contribution
    ) {
      const { contribution } = this.state;
      const maxInstallments = contribution?.policy?.product?.maxInstallments;

      if (maxInstallments === 0 && contribution.amount !== 0) {
        this.setState((prevState) => ({
          contribution: {
            ...prevState.contribution,
            amount: 0,
          },
        }));
      }

      if (
        maxInstallments === 1 &&
        contribution.amount !== contribution.policy?.value
      ) {
        this.setState((prevState) => ({
          contribution: {
            ...prevState.contribution,
            amount: contribution.policy?.value,
          },
        }));
      }

      if (
        maxInstallments > 1 &&
        (prevState.contribution.policy?.uuid !== contribution.policy?.uuid ||
          prevState.contribution.policy.product?.maxInstallments !==
            maxInstallments)
      ) {
        const { modulesManager, fetchPoliciesPremiums } = this.props;
        fetchPoliciesPremiums(modulesManager, [
          `policyUuids: ["${contribution.policy.uuid}"]`,
        ]).then((res) => {
          const { totalCount } = res.payload.data.premiumsByPolicies;

          if (totalCount === maxInstallments - 1) {
            const amount = contribution.policy?.value - contribution.policy?.sumPremiums;
            this.setState((prevState) => ({
              contribution: {
                ...prevState.contribution,
                amount: parseFloat(amount.toFixed(2)),
              },
            }));
          }
        });
      }
    }
  }

  componentWillUnmount = () => {
    this.props.clearContribution();
  };

  reload = () => {
    const { contribution } = this.state;
    this.props.fetchContribution(
      this.props.modulesManager,
      this.state.contribution_uuid,
      contribution.clientMutationId
    );
  };

  canSave = () => {
    const { contribution } = this.state;
    const { isReceiptValid } = this.props;
    if (
      contribution?.policy?.product?.maxInstallments === 0 ||
      contribution.amount >
        Number(contribution.policy?.value - contribution.policy?.sumPremiums) ||
      (contribution?.id && contribution?.policy?.product?.maxInstallments === 1)
    )
      return false;

    if (
      !contribution ||
      (contribution &&
        (!contribution.payDate ||
          !contribution.payType ||
          !contribution.amount ||
          !contribution.receipt ||
          !contribution.policy ||
          contribution.validityTo ||
          (contribution.policy && !contribution.policy.uuid) ||
          !isReceiptValid))
    )
      return false;
    return true;
  };

  confirmSave = () => {
    this.setState({ saveContribution: true });
  };

  _save = (action) => {
    this.setState((prevState) => {
      const { contribution } = prevState;
      if (!!action) {
        contribution.action = action;
      }
      this.props.save(contribution);
      return {
        saveContribution: false,
      };
    });
  };

  onEditedChanged = (contribution) => {
    this.setState({ contribution, newContribution: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  _cancelSave() {
    const { update } = this.state;
    this.setState({
      saveContribution: false,
      update: !update,
    });
  }

  redirectToFamily = () => {
    try {
      const { modulesManager, history } = this.props;
      const { contribution } = this.state;
      const familyUuid = contribution?.policy?.family?.uuid;

      historyPush(modulesManager, history, INSUREE_FAMILY_ROUTE_REF, [
        familyUuid,
      ]);
    } catch (error) {
      console.error(`[CONTRIBUTION_FORM]: ${error}`);
    }
  };

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
    const { contribution, saveContribution, newContribution, reset, update } =
    this.state;
    
    if (!rights.includes(RIGHT_CONTRIBUTION)) return null;
    let runningMutation = !!contribution && !!contribution.clientMutationId;
    let contributedMutations = modulesManager.getContribs(
      CONTRIBUTION_OVERVIEW_MUTATIONS_KEY
    );
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    const actions = [
      {
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation,
      },
      {
        doIt: this.redirectToFamily,
        icon: <People />,
        tooltip: formatMessage(this.props.intl, "contribution", "redirectToFamily.tooltip"),
        disabled: !contribution?.policy?.family?.uuid,
      }
    ];
    return (
      <div
        className={
          !!runningMutation || contribution?.validityTo
            ? classes.lockedPage
            : null
        }
      >
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "contribution",
            "ContributionOverview.title"
          )}
        />
        <SaveContributionDialog
          contribution={saveContribution && contribution}
          onConfirm={this._save}
          onCancel={() => this._cancelSave()}
          installmentsNumber={this.props?.installmentsNumber}
        />
        <ProgressOrError
          progress={fetchingContribution}
          error={errorContribution}
        />
        {((!!fetchedContribution &&
          !!contribution &&
          contribution.uuid === contribution_uuid) ||
          !contribution_uuid) && (
          <Form
            module="contribution"
            title={
              !!newContribution
                ? "ContributionOverview.newTitle"
                : "ContributionOverview.title"
            }
            edited_id={contribution_uuid}
            edited={contribution}
            reset={reset}
            back={back}
            // add={!!add && !newContribution ? this._add : null}
            readOnly={
              readOnly ||
              runningMutation ||
              (contribution && !!contribution.validityTo)
            }
            actions={actions}
            overview={overview}
            HeadPanel={ContributionMasterPanel}
            contribution={contribution}
            onEditedChanged={this.onEditedChanged}
            canSave={this.canSave}
            save={!!save ? this.confirmSave : null}
            update={update}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={save}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  fetchingContribution: state.contribution.fetchingContribution,
  errorContribution: state.contribution.errorContribution,
  fetchedContribution: state.contribution.fetchedContribution,
  installmentsNumber: state.contribution.policiesPremiumsPageInfo.totalCount,
  submittingMutation: state.contribution.submittingMutation,
  policySummary: state.contribution.policySummary,
  mutation: state.contribution.mutation,
  contribution: state.contribution.contribution,
  confirmed: state.core.confirmed,
  state: state,
  isReceiptValid:
    state.contribution?.validationFields?.contributionReceipt.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchPoliciesPremiums,
      fetchContribution,
      fetchPolicySummary,
      newContribution,
      createContribution,
      clearContribution,
      journalize,
      coreConfirm,
    },
    dispatch
  );
};

export default withHistory(
  withModulesManager(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(injectIntl(withTheme(withStyles(styles)(ContributionForm))))
  )
);
