import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";

import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  historyPush,
  withModulesManager,
  withHistory,
  clearCurrentPaginationPage,
} from "@openimis/fe-core";
import ContributionSearcher from "../components/ContributionSearcher";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
});

class ContributionsPage extends Component {
  onDoubleClick = (c, newTab = false) => {
    historyPush(
      this.props.modulesManager,
      this.props.history,
      "contribution.contributionOverview",
      [c.uuid],
      newTab
    );
  };

  componentDidMount = () => {
    const moduleName = "contribution";
    const { module } = this.props;
    if (module !== moduleName) this.props.clearCurrentPaginationPage();
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.page}>
        <ContributionSearcher
          cacheFiltersKey="contributionsPageFiltersCache"
          onDoubleClick={this.onDoubleClick}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  rights:
    !!state.core && !!state.core.user && !!state.core.user.i_user
      ? state.core.user.i_user.rights
      : [],
  module: state.core?.savedPagination?.module,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({ clearCurrentPaginationPage }, dispatch);

export default injectIntl(
  withModulesManager(
    withHistory(
      connect(
        mapStateToProps,
        mapDispatchToProps
      )(withTheme(withStyles(styles)(ContributionsPage)))
    )
  )
);
