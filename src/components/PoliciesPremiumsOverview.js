import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from 'react-intl';
import _ from "lodash";

import { Paper, IconButton, Grid, Divider, Typography, Tooltip } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay"
import {
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@material-ui/icons';

import {
    formatMessage,
    formatMessageWithValues,
    formatAmount,
    formatDateFromISO,
    withModulesManager,
    withTooltip,
    formatSorter,
    sort,
    PublishedComponent,
    Table,
    PagedDataHandler,
    journalize,
    historyPush,
    coreAlert,
} from "@openimis/fe-core";
import {
    fetchPoliciesPremiums,
    selectPremium,
    deleteContribution,
    fetchPolicySummary
} from "../actions";
import {
    RIGHT_CONTRIBUTION_DELETE,
    RIGHT_CONTRIBUTION_ADD,
} from "../constants";
import DeleteContributionDialog from "./DeleteContributionDialog";

const styles = theme => ({
    paper: theme.paper.paper,
    paperHeader: theme.paper.header,
    paperHeaderAction: theme.paper.action,
    tableTitle: theme.table.title,
    fab: theme.fab,
    disabled: {
        opacity: 0.4,
    }
});

class PoliciesPremiumsOverview extends PagedDataHandler {

    constructor(props) {
        super(props);
        this.rowsPerPageOptions = props.modulesManager.getConf("fe-contribution", "familyPremiumsOverview.rowsPerPageOptions", [2, 5, 10, 20]);
        this.defaultPageSize = props.modulesManager.getConf("fe-contribution", "familyPremiumsOverview.defaultPageSize", 2);
    }

    componentDidMount() {
        this.setState({
            orderBy: "-payDate",
            deleteContribution: null,
        }, e => this.query())
    }

    checkNewPremium = () => {
        const {
          policy,
          modulesManager,
          history,
          pageInfo,
          policySummary,
          coreAlert,
          intl,
        } = this.props;
    
        const maxInstallments = policySummary?.product?.maxInstallments;
    
        // NOTE: 0 - no installments allowed, null - no limit
        if (maxInstallments === 0) {
          coreAlert(
            formatMessage(
              intl,
              'contribution',
              'addContributionDialog.maxINstallments.title'
            ),
            formatMessage(
              intl,
              'contribution',
              'addContributionDialog.noInstallmentsAllowed.message'
            )
          );
        } else if (
          maxInstallments !== null &&
          maxInstallments <= pageInfo?.totalCount
        ) {
          coreAlert(
            formatMessage(
              intl,
              'contribution',
              'addContributionDialog.maxINstallments.title'
            ),
            formatMessage(
              intl,
              'contribution',
              'addContributionDialog.maxINstallments.message'
            )
          );
        } else
          historyPush(modulesManager, history, 'contribution.contributionNew', [
            policy.policyUuid,
          ]);
      };

    addNewPremium = () => {
        const {
            policy,
            modulesManager,
            history,
        } = this.props;
        historyPush(modulesManager, history, "contribution.contributionNew", [policy.policyUuid]);
    }

    onDoubleClick = (i, newTab = false) => {
        const {
            modulesManager,
            history,
        } = this.props;
        historyPush(modulesManager, history, "contribution.contributionOverview", [i.uuid], newTab);
    }

    policiesChanged = (prevProps) =>
        (!_.isEqual(prevProps.policies, this.props.policies) && !!this.props.policies && !!this.props.policies.length) ||
        (!_.isEqual(prevProps.policy, this.props.policy))

    componentDidUpdate(prevProps) {
        if (this.policiesChanged(prevProps)) {
            this.query();
            if (this.props?.policy?.policyUuid) {
                this.props.fetchPolicySummary(this.props.modulesManager, this.props?.policy?.policyUuid)
            }
        }
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
        }
    }

    queryPrms = () => {
        const { policy, policies } = this.props;
        const { orderBy } = this.state;

        if (policy) {
          return [
            `orderBy: "${orderBy}"`,
            `policyUuids: ${JSON.stringify([policy.policyUuid])}`,
          ];
        } else if (policies?.length) {
          const policiesUuids = JSON.stringify(
            policies.map((policy) => policy.policyUuid)
          );
          return [`orderBy: "${orderBy}"`, `policyUuids: ${policiesUuids}`];
        }

        return null;
    }

    onChangeSelection = (i) => {
        this.props.selectPremium(i[0] || null)
    }

    headers = [
        "contribution.payDate",
        "contribution.payer",
        "contribution.amount",
        "contribution.payType",
        "contribution.receipt",
        "contribution.category",
        "",
    ];

    sorter = (attr, asc = true) => [
        () => this.setState((state, props) => ({ orderBy: sort(state.orderBy, attr, asc) }), e => this.query()),
        () => formatSorter(this.state.orderBy, attr, asc)
    ]

    headerActions = [
        this.sorter("payDate"),
        this.sorter("payer"),
        this.sorter("amount"),
        this.sorter("payType"),
        this.sorter("receipt"),
        this.sorter("category"),
    ];


    confirmDelete = deleteContribution => {
        this.setState({ deleteContribution, })
    }

    deletePremiumAction = (i) =>
        !!i.validityTo || !!i.clientMutationId ? null :
            <Tooltip title={formatMessage(this.props.intl, "contribution", "deletePremium.tooltip")}>
                <IconButton onClick={() => this.confirmDelete(i)}><DeleteIcon /></IconButton>
            </Tooltip>

    itemFormatters = () => {
        const formatters = [
            p => formatDateFromISO(this.props.modulesManager, this.props.intl, p.payDate),
            p => <PublishedComponent
                readOnly={true}
                pubRef="payer.PayerPicker" withLabel={false} value={p.payer}
            />,
            p => formatAmount(this.props.intl, p.amount),
            p => <PublishedComponent
                readOnly={true}
                pubRef="contribution.PremiumPaymentTypePicker" withLabel={false} value={p.payType}
            />,
            p => p.receipt,
            p => formatMessage(this.props.intl, "contribution", `category.${!!p.isPhotoFee ? "photoFee" : "contribution"}`),
        ];

        if (!!this.props.rights.includes(RIGHT_CONTRIBUTION_DELETE)) {
            formatters.push(this.deletePremiumAction)
        }
        return formatters;
    }

    deleteContribution = () => {
        let contribution = this.state.deleteContribution;
        this.props.selectPremium(null);
        this.setState(
            { deleteContribution: null },
            (e) => {
                this.props.deleteContribution(
                    this.props.modulesManager,
                    contribution,
                    formatMessage(this.props.intl, "contribution", "deleteContributionDialog.title"))
            });
    }

    header = () => {
        const { modulesManager, intl, pageInfo, policy } = this.props;
        if (!!policy && !!policy.policyUuid) {
            return formatMessageWithValues(
                intl, "contribution", "PoliciesPremiumsOfPolicy",
                {
                    count: pageInfo.totalCount,
                    policy: `${policy.productCode}(${formatDateFromISO(modulesManager, intl, policy.effectiveDate)} - ${formatDateFromISO(modulesManager, intl, policy.expiryDate)})`
                }
            )
        } else {
            return formatMessageWithValues(
                intl, "contribution", "PoliciesPremiums",
                { count: pageInfo.totalCount }
            )
        }
    }


    rowDisabled = (i) => !!i && !!i.validityTo
    rowLocked = (i) => !!i && !!i.clientMutationId

    render() {
        const {
            intl,
            family,
            classes,
            policiesPremiums,
            errorPoliciesPremiums,
            pageInfo,
            readOnly,
            policy,
            rights,
            fetchingPoliciesPremiums,
        } = this.props;
        if (!family.uuid) return null;
        const canAdd = rights.includes(RIGHT_CONTRIBUTION_ADD);
        let actions = [
            {
                button: <IconButton onClick={this.query}><ReplayIcon /></IconButton>,
                tooltip: formatMessage(intl, "contribution", "reload.tooltip")
            }
        ];
        if (!!!readOnly && canAdd) {
            actions.push(
                {
                    button: <IconButton className={!policy ? classes.disabled : ""} onClick={!policy ? null : this.checkNewPremium}><AddIcon /></IconButton>,
                    tooltip: !policy ?
                        formatMessage(intl, "contribution", "addNewPremium.tooltip.selectPolicy") :
                        formatMessage(intl, "contribution", "addNewPremium.tooltip")
                }
            )
        }
        return (
            <>
                <DeleteContributionDialog
                    contribution={this.state.deleteContribution}
                    onConfirm={this.deleteContribution}
                    onCancel={e => this.setState({ deleteContribution: null })} />
                <Paper className={classes.paper}>
                    <Grid container alignItems="center" direction="row" className={classes.paperHeader}>
                        <Grid item xs={8}>
                            <Typography className={classes.tableTitle}>
                                {this.header()}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Grid container direction="row" justify="flex-end">
                                {actions.map((a, idx) => {
                                    return (
                                        <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                                            {withTooltip(a.button, a.tooltip)}
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider />
                    <Table
                        fetching={fetchingPoliciesPremiums}
                        module="contribution"
                        headerActions={this.headerActions}
                        headers={this.headers}
                        itemFormatters={this.itemFormatters()}
                        items={policiesPremiums || []}
                        error={errorPoliciesPremiums}
                        onDoubleClick={this.onDoubleClick}
                        withSelection={"single"}
                        onChangeSelection={this.onChangeSelection}
                        withPagination={true}
                        rowsPerPageOptions={this.rowsPerPageOptions}
                        defaultPageSize={this.defaultPageSize}
                        page={this.currentPage()}
                        pageSize={this.currentPageSize()}
                        rowDisabled={i => this.rowDisabled(i)}
                        rowLocked={i => this.rowLocked(i)}
                        count={pageInfo.totalCount}
                        onChangePage={this.onChangePage}
                        onChangeRowsPerPage={this.onChangeRowsPerPage}
                    />
                </Paper>
            </>
        )
    }
}

const mapStateToProps = state => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    family: state.insuree.family || {},
    policy: state.policy.policy,
    policies: state.policy.policies,
    fetchingPoliciesPremiums: state.contribution.fetchingPoliciesPremiums,
    fetchedPoliciesPremiums: state.contribution.fetchedPoliciesPremiums,
    policiesPremiums: state.contribution.policiesPremiums,
    fetchingPolicySummary: state?.contribution?.fetchingPolicySummary,
    fetchedPolicySummary: state?.contribution?.fetchedPolicySummary,
    policySummary: state?.contribution?.policySummary,
    pageInfo: state.contribution.policiesPremiumsPageInfo,
    errorPoliciesPremiums: state.contribution.errorPoliciesPremiums,
    errorContributions: state.contribution.errorContributions,
    submittingMutation: state.contribution.submittingMutation,
    mutation: state.contribution.mutation,
});

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        fetch: fetchPoliciesPremiums,
        selectPremium,
        deleteContribution,
        fetchPolicySummary,
        journalize,
        coreAlert,
    }, dispatch);
};

export default withModulesManager(
    injectIntl(
        withTheme(
            withStyles(styles)(
                connect(mapStateToProps, mapDispatchToProps)(PoliciesPremiumsOverview)
            )
        )
    )
);