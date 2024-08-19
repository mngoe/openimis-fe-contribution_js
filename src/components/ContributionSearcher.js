
import React, { Component, Fragment } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import {  IconButton, Tooltip } from "@material-ui/core";
import {
   Tab as TabIcon, Delete as DeleteIcon
} from '@material-ui/icons';
import ContributionFilter from './ContributionFilter';
import {
    withModulesManager, formatMessageWithValues, formatDateFromISO, formatMessage,
    Searcher, PublishedComponent, formatAmount, journalize,
} from "@openimis/fe-core";

import { fetchContributionsSummaries, deleteContribution } from "../actions";
import { RIGHT_CONTRIBUTION_DELETE } from "../constants";
import DeleteContributionDialog from "./DeleteContributionDialog";

const FAMILY_SEARCHER_CONTRIBUTION_KEY = "contribution.ContributionSearcher";

class ContributionSearcher extends Component {

    state = {
        deleteContribution: null,
        reset: 0,
    }

    constructor(props) {
        super(props);
        this.rowsPerPageOptions = [10, 20, 50, 100];
        this.defaultPageSize = 10;
        this.locationLevels = 4;
    }

    componentDidUpdate(prevProps) {
        if (prevProps.submittingMutation && !this.props.submittingMutation) {
            this.props.journalize(this.props.mutation);
            this.setState({ reset: this.state.reset + 1 });
        }
    }

    fetch = (prms) => {
        this.props.fetchContributionsSummaries(
            this.props.modulesManager,
            prms
        )
    }

    rowIdentifier = (r) => r.uuid

    filtersToQueryParams = (state) => {
        let prms = Object.keys(state.filters)
            .filter(contrib => !!state.filters[contrib]['filter'])
            .map(contrib => state.filters[contrib]['filter']);
        if (!state.beforeCursor && !state.afterCursor) {
            prms.push(`first: ${state.pageSize}`);
        }
        if (!!state.afterCursor) {
            prms.push(`after: "${state.afterCursor}"`)
            prms.push(`first: ${state.pageSize}`);
        }
        if (!!state.beforeCursor) {
            prms.push(`before: "${state.beforeCursor}"`)
            prms.push(`last: ${state.pageSize}`);
        }
        if (!!state.orderBy) {
            prms.push(`orderBy: ["${state.orderBy}"]`);
        }
        return prms;
    }

    headers = (filters) => {
        var h = [
            "contribution.payDate",
            "contribution.payer",
            "contribution.amount",
            "contribution.payType",
            "contribution.receipt",
            "contribution.category",
            "contribution.openNewTabHead"
        ]
        return h;
    }

    sorts = (filters) => {
        var results = [
            ['payDate', true],
            ['payer', true],
            ['amount', true],
            ['payType', true],
            ['receipt', true],
            ['isPhotoFee', true]
        ];
        return results;
    }

    deleteContribution = () => {
        let contribution = this.state.deleteContribution;
        this.setState(
            { deleteContribution: null },
            (e) => {
                this.props.deleteContribution(
                    this.props.modulesManager,
                    contribution,
                    formatMessage(this.props.intl, "contribution", "deleteContributionDialog.title"))
            })
    }

    confirmDelete = deleteContribution => {
        this.setState({ deleteContribution,})
    }

    deletePremiumAction = (i) =>
        !!i.validityTo || !!i.clientMutationId ? null :
            <Tooltip title={formatMessage(this.props.intl, "contribution", "deletePremium.tooltip")}>
                <IconButton onClick={() => this.confirmDelete(i)}><DeleteIcon /></IconButton>
            </Tooltip>

    itemFormatters = () => {
        const formatters =  [
            c => formatDateFromISO(this.props.modulesManager, this.props.intl, c.payDate),
            c => c.payer?.name ?? "",
            c => formatAmount(this.props.intl, c.amount),
            c => <PublishedComponent
                readOnly={true}
                pubRef="contribution.PremiumPaymentTypePicker" withLabel={false} value={c.payType}
            />,
            c => c.receipt,
            c => formatMessage(this.props.intl, "contribution", `contribution.category.${!!c.isPhotoFee ? "photoFee" : "contribution"}`),

            c => (
                <Tooltip title={formatMessage(this.props.intl, "contribution", "contribution.openNewTab")}>
                    <IconButton onClick={e => this.props.onDoubleClick(c, true)} > <TabIcon /></IconButton >
                </Tooltip>
            )
        ];

        if (!!this.props.rights.includes(RIGHT_CONTRIBUTION_DELETE)) {
            formatters.push(this.deletePremiumAction)
        }
        return formatters;
    }

    rowDisabled = (selection, i) => !!i.validityTo
    rowLocked = (selection, i) => !!i.clientMutationId

    render() {
        const { intl,
            contributions, contributionsPageInfo, fetchingContributions, fetchedContributions, errorContributions,
            filterPaneContributionsKey, cacheFiltersKey, onDoubleClick
        } = this.props;
        let count = contributionsPageInfo.totalCount;
        return (
            <Fragment>
                <DeleteContributionDialog
                    contribution={this.state.deleteContribution}
                    onConfirm={this.deleteContribution}
                    onCancel={e => this.setState({ deleteContribution: null })} />
                <Searcher
                    module="contribution"
                    cacheFiltersKey={cacheFiltersKey}
                    FilterPane={ContributionFilter}
                    filterPaneContributionsKey={filterPaneContributionsKey}
                    items={contributions}
                    itemsPageInfo={contributionsPageInfo}
                    fetchingItems={fetchingContributions}
                    fetchedItems={fetchedContributions}
                    errorItems={errorContributions}
                    contributionKey={FAMILY_SEARCHER_CONTRIBUTION_KEY}
                    tableTitle={formatMessageWithValues(intl, "contribution", "contributionSummaries", { count })}
                    rowsPerPageOptions={this.rowsPerPageOptions}
                    defaultPageSize={this.defaultPageSize}
                    fetch={this.fetch}
                    rowIdentifier={this.rowIdentifier}
                    filtersToQueryParams={this.filtersToQueryParams}
                    defaultOrderBy="-payDate"
                    headers={this.headers}
                    itemFormatters={this.itemFormatters}
                    sorts={this.sorts}
                    rowDisabled={this.rowDisabled}
                    rowLocked={this.rowLocked}
                    onDoubleClick={c => !c.clientMutationId && onDoubleClick(c)}
                    reset={this.state.reset}
                />
            </Fragment>
        )
    }
}

const mapStateToProps = state => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
    contributions: state.contribution.contributions,
    contributionsPageInfo: state.contribution.contributionsPageInfo,
    fetchingContributions: state.contribution.fetchingContributions,
    fetchedContributions: state.contribution.fetchedContributions,
    errorContributions: state.contribution.errorContributions,
    submittingMutation: state.contribution.submittingMutation,
    mutation: state.contribution.mutation,
});


const mapDispatchToProps = dispatch => {
    return bindActionCreators(
        { fetchContributionsSummaries, deleteContribution, journalize },
        dispatch);
};

export default withModulesManager(connect(mapStateToProps, mapDispatchToProps)(injectIntl(ContributionSearcher)));