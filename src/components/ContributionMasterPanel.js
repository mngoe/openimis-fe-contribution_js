import React from "react";
import { connect } from "react-redux";
import { injectIntl } from "react-intl";

import { withTheme, withStyles } from "@material-ui/core/styles";
import { Grid } from "@material-ui/core";

import {
  withHistory,
  withModulesManager,
  AmountInput,
  TextInput,
  ValidatedTextInput,
  PublishedComponent,
  formatMessageWithValues,
  formatMessage,
  FormPanel,
  WarningBox,
} from "@openimis/fe-core";
import {
  validateReceipt,
  clearReceiptValidation,
  setReceiptValid,
} from "../actions";

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});

class ContributionMasterPanel extends FormPanel {
  shouldValidate = (inputValue) => {
    const { savedCode } = this.props;
    const shouldValidate = inputValue !== savedCode;
    return shouldValidate;
  };

  renderWarning = () => {
    const { intl, edited } = this.props;

    if (edited.id) {
      return null;
    }

    if (
      edited.amount > Number(edited.policy?.value - edited.policy?.sumPremiums)
    ) {
      return (
        <WarningBox
          title={formatMessage(intl, 'contribution', 'warning.header')}
          description={formatMessage(
            intl,
            'contribution',
            'warning.paid.exceedsPolicyValue'
          )}
          xs={12}
        />
      );
    }

    if (Number(edited.policy.value) - edited.policy.sumPremiums === 0) {
      return (
        <WarningBox
          title={formatMessage(intl, 'contribution', 'warning.header')}
          description={formatMessage(
            intl,
            'contribution',
            'warning.paid.description'
          )}
          xs={12}
        />
      );
    }

    return null;
  };

  render() {
    const {
      intl,
      classes,
      edited,
      readOnly,
      isReceiptValid,
      isReceiptValidating,
      receiptValidationError,
      contributionTotalCount,
    } = this.props;
    const productCode = edited?.policy?.product?.code;

    const maxInstallments = edited?.policy?.product?.maxInstallments;
    const balance =
      Number(edited?.policy?.value) -
      edited?.policy?.otherPremiums -
      (edited?.amount || 0);
      return (
        <Grid container className={classes.item}>
          {!!edited && !!edited.policy && !!edited.policy.value && (
            <>
              {this.renderWarning()}
              <Grid item xs={3} className={classes.item}>
                <TextInput
                  module='contribution'
                  label='contribution.policy.name'
                  readOnly={true}
                  value={
                    (edited.policy.product && edited.policy.product.name) || ''
                  }
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <AmountInput
                  module='contribution'
                  label='contribution.policy.value'
                  required
                  readOnly={true}
                  value={edited.policy.value || ''}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef='core.DatePicker'
                  value={edited.policy.startDate || ''}
                  module='contribution'
                  label='contribution.policy.startDate'
                  readOnly={true}
                />
              </Grid>
              <Grid item xs={3} className={classes.item}>
                <PublishedComponent
                  pubRef='core.DatePicker'
                  value={edited.policy.expiryDate || ''}
                  module='contribution'
                  label='contribution.policy.expiryDate'
                  readOnly={true}
                />
              </Grid>
              {edited.policy?.family?.uuid && (
                <>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module='contribution'
                      label='contribution.familySummaries.insuranceNo'
                      readOnly={true}
                      value={edited.policy.family?.headInsuree?.chfId}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module='contribution'
                      label='contribution.familySummaries.lastName'
                      readOnly={true}
                      value={edited.policy.family?.headInsuree?.lastName}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module='contribution'
                      label='contribution.familySummaries.otherNames'
                      readOnly={true}
                      value={edited.policy.family?.headInsuree?.otherNames}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef='core.DatePicker'
                      value={edited.policy.family?.headInsuree?.dob}
                      module='contribution'
                      label='contribution.familySummaries.dob'
                      readOnly={true}
                    />
                  </Grid>
                </>
              )}
            </>
          )}
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef='core.DatePicker'
              value={!edited ? '' : edited.payDate}
              module='contribution'
              required
              label='contribution.payDate'
              readOnly={readOnly}
              onChange={(c) => this.updateAttribute('payDate', c)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef='payer.PayerPicker'
              withNull={true}
              readOnly={readOnly}
              value={!edited ? '' : edited.payer}
              onChange={(p) => this.updateAttribute('payer', p)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef='contribution.PremiumPaymentTypePicker'
              withNull={false}
              required
              readOnly={readOnly}
              value={!edited ? '' : edited.payType}
              onChange={(c) => this.updateAttribute('payType', c)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef='contribution.PremiumCategoryPicker'
              withNull={false}
              readOnly={readOnly}
              value={edited && edited.isPhotoFee ? 'photoFee' : 'contribution'}
              onChange={(c) => {
                return this.updateAttribute('isPhotoFee', c === 'photoFee');
              }}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <ValidatedTextInput
              action={validateReceipt}
              clearAction={clearReceiptValidation}
              setValidAction={setReceiptValid}
              codeTakenLabel={formatMessageWithValues(
                intl,
                'contribution',
                'alreadyUsed',
                { productCode }
              )}
              isValid={isReceiptValid}
              isValidating={isReceiptValidating}
              itemQueryIdentifier='code'
              label='contribution.receipt'
              module='contribution'
              onChange={(receipt) => this.updateAttribute('receipt', receipt)}
              readOnly={readOnly}
              required={true}
              additionalQueryArgs={{ policyUuid: edited?.policy?.uuid }}
              shouldValidate={this.shouldValidate}
              validationError={receiptValidationError}
              value={edited?.receipt ?? ''}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <AmountInput
              module='contribution'
              label='contribution.amount'
              required
              readOnly={
                readOnly ||
                maxInstallments === 0 ||
                maxInstallments === 1 ||
                (!edited.id &&
                  maxInstallments > 1 &&
                  contributionTotalCount === maxInstallments - 1)
              }
              value={edited.amount}
              max={
                !edited.id &&
                edited?.amount >
                  edited.policy?.value - edited.policy?.sumPremiums
                  ? parseFloat(
                      edited.policy?.value - edited.policy?.sumPremiums
                    ).toFixed(2)
                  : null
              }
              displayZero={true}
              onChange={(c) => this.updateAttribute('amount', c)}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <AmountInput
              module='policy'
              label='Policy.sumPremiums'
              readOnly={true}
              value={edited?.policy?.sumPremiums || 0}
              displayZero={true}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <AmountInput
              name='balance'
              module='policy'
              label='policies.balance'
              readOnly={true}
              value={balance || 0}
              displayZero={true}
            />
          </Grid>
        </Grid>
      );
  }
}

const mapStateToProps = (store) => ({
  isReceiptValidating:
    store.contribution?.validationFields?.contributionReceipt.isValidating,
  isReceiptValid:
    store.contribution?.validationFields?.contributionReceipt.isValid,
  receiptValidationError:
    store.contribution?.validationFields?.contributionReceipt.validationError,
  savedCode: store.contribution.contribution?.receipt,
  contributionTotalCount: store.contribution.policiesPremiumsPageInfo?.totalCount ?? 0,
});

export default withModulesManager(
  withHistory(
    injectIntl(
      connect(mapStateToProps)(
        withTheme(withStyles(styles)(ContributionMasterPanel))
      )
    )
  )
);
