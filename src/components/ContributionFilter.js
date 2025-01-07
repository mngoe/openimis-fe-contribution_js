import React, { Component } from "react";
import { injectIntl } from "react-intl";
import _debounce from "lodash/debounce";

import { Grid, Checkbox, FormControlLabel } from "@material-ui/core";
import { withTheme, withStyles } from "@material-ui/core/styles";

import {
  withModulesManager,
  AmountInput,
  PublishedComponent,
  ControlledField,
  TextInput,
  formatMessage,
  decodeId,
} from "@openimis/fe-core";

const styles = (theme) => ({
  dialogTitle: theme.dialog.title,
  dialogContent: theme.dialog.content,
  form: {
    padding: 0,
  },
  item: {
    padding: theme.spacing(1),
  },
  paperDivider: theme.paper.divider,
});

class ContributionFilter extends Component {
  debouncedOnChangeFilter = _debounce(
    this.props.onChangeFilters,
    this.props.modulesManager.getConf("fe-contribution", "debounceTime", 200)
  );

  _filterValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : null;
  };

  _filterTextFieldValue = (k) => {
    const { filters } = this.props;
    return !!filters && !!filters[k] ? filters[k].value : "";
  };

  _onChangeCheckbox = (key, value) => {
    let filters = [
      {
        id: key,
        value: value,
        filter: `${key}: ${value}`,
      },
    ];
    this.props.onChangeFilters(filters);
  };

  render() {
    const { classes, filters, onChangeFilters, intl } = this.props;
    return (
      <section className={classes.form}>
        <Grid container>
          <ControlledField
            module="contribution"
            id="ContributionFilter.location"
            field={
              <Grid item xs={12}>
                <PublishedComponent
                  pubRef="location.DetailedLocationFilter"
                  withNull={true}
                  filters={filters}
                  onChangeFilters={onChangeFilters}
                  anchor="parentLocation"
                />
              </Grid>
            }
          />
          <ControlledField
            module="contribution"
            id="ContributionFilter.payDate"
            field={
              <Grid item xs={4}>
                <Grid container>
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={this._filterValue("payDateFrom")}
                      module="contribution"
                      label="contribution.payDateFrom"
                      onChange={(d) =>
                        onChangeFilters([
                          {
                            id: "payDateFrom",
                            value: d,
                            filter: `payDate_Gte: "${d}"`,
                          },
                        ])
                      }
                    />
                  </Grid>
                  <Grid item xs={6} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={this._filterValue("payDateTo")}
                      module="contribution"
                      label="contribution.payDateTo"
                      onChange={(d) =>
                        onChangeFilters([
                          {
                            id: "payDateTo",
                            value: d,
                            filter: `payDate_Lte: "${d}"`,
                          },
                        ])
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>
            }
          />
          <ControlledField
            module="contribution"
            id="ContributionFilter.payer"
            field={
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="payer.PayerPicker"
                  withNull={true}
                  value={this._filterValue("payer")}
                  onChange={(v) =>
                    onChangeFilters([
                      {
                        id: "payer",
                        value: v,
                        filter: `payerId: "${v && v.id ? decodeId(v.id) : null}"`,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
          {["amount_Gte", "amount_Lte"].map((a) => (
            <ControlledField
              module="contribution"
              id="ContributionFilter.amountUnder"
              key={a}
              field={
                <Grid item xs={2} className={classes.item}>
                  <AmountInput
                    module="contribution"
                    label={`contribution.${a}`}
                    value={filters[a] && filters[a]["value"]}
                    onChange={(v) =>
                      this.debouncedOnChangeFilter([
                        {
                          id: a,
                          value: !v ? null : v,
                          filter: !!v ? `${a}: "${v}"` : null,
                        },
                      ])
                    }
                  />
                </Grid>
              }
            />
          ))}
        </Grid>
        <Grid container>
          <ControlledField
            module="contribution"
            id="ContributionFilter.payType"
            field={
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="contribution.PremiumPaymentTypePicker"
                  withNull={true}
                  value={this._filterValue("payType")}
                  onChange={(v) =>
                    onChangeFilters([
                      {
                        id: "payType",
                        value: v,
                        filter: !!v ? `payType: "${v}"` : null,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
          <ControlledField
            module="contribution"
            id="contribution.category"
            field={
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="contribution.PremiumCategoryPicker"
                  withNull={true}
                  value={this._filterValue("isPhotoFee")}
                  onChange={(c) =>
                    onChangeFilters([
                      {
                        id: "isPhotoFee",
                        value: c,
                        filter: `isPhotoFee: ${c !== "contribution"}`,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
          <ControlledField
            module="contribution"
            id="ContributionFilter.receipt"
            field={
              <Grid item xs={4} className={classes.item}>
                <TextInput
                  module="contribution"
                  label="contribution.receipt"
                  name="receipt"
                  value={this._filterTextFieldValue("receipt")}
                  onChange={(v) =>
                    this.debouncedOnChangeFilter([
                      {
                        id: "receipt",
                        value: v,
                        filter: `receipt_Icontains: "${v}"`,
                      },
                    ])
                  }
                />
              </Grid>
            }
          />
        </Grid>

        <Grid container justify="flex-end">
          <ControlledField
            module="contribution"
            id="ContributionFilter.showHistory"
            field={
              <Grid item xs={2} className={classes.item}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={!!this._filterValue("showHistory")}
                      onChange={(event) =>
                        this._onChangeCheckbox(
                          "showHistory",
                          event.target.checked
                        )
                      }
                    />
                  }
                  label={formatMessage(intl, "contribution", "showHistory")}
                />
              </Grid>
            }
          />
        </Grid>
      </section>
    );
  }
}

export default withModulesManager(
  injectIntl(withTheme(withStyles(styles)(ContributionFilter)))
);
