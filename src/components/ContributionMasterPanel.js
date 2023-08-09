import React, { Fragment } from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { injectIntl } from 'react-intl';
import {
    Grid,
} from "@material-ui/core";
import {
    withHistory,
    withModulesManager,
    AmountInput,
    TextInput,
    NumberInput,
    PublishedComponent,
    FormPanel
} from "@openimis/fe-core";


const styles = theme => ({
    tableTitle: theme.table.title,
    item: theme.paper.item,
    fullHeight: {
        height: "100%"
    },
});

class ContributionMasterPanel extends FormPanel {
    render() {
        const {
            classes,
            edited,
            readOnly,
        } = this.props;
        return (
            <Fragment>
                {!!edited && !!edited.policy && !!edited.policy.value && (
                    <Grid container className={classes.item}>
                        <Grid item xs={3} className={classes.item}>
                            <TextInput
                                module="contribution"
                                label="contribution.policy.name"
                                readOnly={true}
                                value={(edited.policy.product && edited.policy.product.name) || ""}
                            />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                            <AmountInput
                                module="contribution"
                                label="contribution.policy.value"
                                required
                                readOnly={true}
                                value={edited.policy.value || ""}
                            />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                            <PublishedComponent pubRef="core.DatePicker"
                                value={edited.policy.startDate || ""}
                                module="contribution"
                                label="contribution.policy.startDate"
                                readOnly={true}
                            />
                        </Grid>
                        <Grid item xs={3} className={classes.item}>
                            <PublishedComponent pubRef="core.DatePicker"
                                value={edited.policy.expiryDate || ""}
                                module="contribution"
                                label="contribution.policy.expiryDate"
                                readOnly={true}
                            />
                        </Grid>
                    </Grid>
                )}
                <Grid container className={classes.item}>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent pubRef="core.DatePicker"
                            value={!edited ? "" : edited.payDate}
                            module="contribution"
                            required
                            label="contribution.payDate"
                            readOnly={readOnly}
                            onChange={c => this.updateAttribute('payDate', c)}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="payer.PayerPicker"
                            withNull={true}
                            readOnly={readOnly}
                            value={!edited ? "" : edited.payer}
                            onChange={p => this.updateAttribute('payer', p)}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <AmountInput
                            module="contribution"
                            label="contribution.amount"
                            required
                            readOnly={readOnly}
                            value={!edited ? "" : edited.amount}
                            onChange={c => this.updateAttribute('amount', c)}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="contribution.PremiumPaymentTypePicker"
                            withNull={true}
                            required
                            readOnly={readOnly}
                            value={!edited ? "" : edited.payType}
                            onChange={c => this.updateAttribute('payType', c)}
                        />
                    </Grid>
                    {!!edited && edited.payType == 'M' && (
                        <Grid item xs={3} className={classes.item}>
                            <PublishedComponent
                                pubRef="contribution.PremiumPaymentOperatorPicker"
                                withNull={true}
                                required
                                readOnly={readOnly}
                                value={!edited ? "" : edited.operator}
                                onChange={c => this.updateAttribute('operator', c)}
                            />
                        </Grid>
                    )
                    }
                    {!!edited && edited.payType == 'M' && (
                        <Grid item xs={3} className={classes.item}>
                            <NumberInput
                                module="contribution"
                                label="Contribution.paymentNumber"
                                required
                                readOnly={readOnly}
                                value={!!edited && !!edited.paymentNumber ? edited.paymentNumber : ""}
                                onChange={(v) => this.updateAttribute("paymentNumber", v)}
                            />
                        </Grid>
                    )
                    }
                    <Grid item xs={3} className={classes.item}>
                        <TextInput
                            module="contribution"
                            label="contribution.receipt"
                            required
                            readOnly={readOnly}
                            value={!edited ? "" : edited.receipt}
                            onChange={c => this.updateAttribute('receipt', c)}
                        />
                    </Grid>
                    <Grid item xs={3} className={classes.item}>
                        <PublishedComponent
                            pubRef="contribution.PremiumCategoryPicker"
                            withNull={false}
                            readOnly={readOnly}
                            value={edited && edited.isPhotoFee ? 'photoFee' : 'contribution'}
                            onChange={c => {
                                return this.updateAttribute('isPhotoFee', c === 'photoFee');
                            }}
                        />
                    </Grid>
                </Grid>
            </Fragment>
        );
    }
}

export default withModulesManager(withHistory(injectIntl(withTheme(
    withStyles(styles)(ContributionMasterPanel)
))));