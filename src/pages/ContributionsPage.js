import React, { Component } from "react";
import { connect } from "react-redux";
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from "@material-ui/core/styles";
import { historyPush, withModulesManager, withHistory } from "@openimis/fe-core"
import ContributionSearcher from "../components/ContributionSearcher";


const styles = theme => ({
    page: theme.page,
    fab: theme.fab
});


class ContributionsPage extends Component {
    constructor(props) {
        super(props);
        let defaultFilters = {};
        this.state = {
          defaultFilters,
        };
      }

    onDoubleClick = (c, newTab = false) => {
        historyPush(this.props.modulesManager, this.props.history, "contribution.contributionOverview", [c.uuid], newTab)
    }

    render() {
        const { classes } = this.props;
        return (
            <div className={classes.page}>
                <ContributionSearcher
                    cacheFiltersKey="contributionsPageFiltersCache"
                    onDoubleClick={this.onDoubleClick}
                    defaultFilters = {this.state.defaultFilters}
                />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
})

export default injectIntl(withModulesManager(
    withHistory(connect(mapStateToProps)(withTheme(withStyles(styles)(ContributionsPage))))
));