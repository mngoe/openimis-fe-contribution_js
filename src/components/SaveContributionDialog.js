import React, { useState } from "react";
import { injectIntl } from 'react-intl';
import { withTheme, withStyles } from "@material-ui/core/styles";

const styles = theme => ({
    primaryButton: theme.dialog.primaryButton,
    secondaryButton: theme.dialog.secondaryButton,
})

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@material-ui/core';

import { FormattedMessage } from "@openimis/fe-core";

const SaveContributionDialog = ({
    classes, contribution, onCancel, onConfirm, installmentsNumber
}) => {
    if (!contribution.policy || !contribution.policy.value) return null;
    const [step, setStep] = useState(1);
    const sumPremiums = parseInt(contribution.policy.sumPremiums || 0, 10);
    const amount = parseInt(contribution.amount, 10) + sumPremiums;
    const policyValue = parseInt(contribution.policy.value, 10);
    const max_installments = contribution?.policy?.product?.maxInstallments;

    return (
        <Dialog
            open={!!contribution}
            onClose={onCancel}
        >
            <DialogTitle>
                <FormattedMessage
                    module="contribution"
                    id="saveContributionDialog.title"
                />
            </DialogTitle>
            <DialogContent>
                {
                    amount < policyValue && (
                        <>
                            {
                                step === 1 && (
                                    <DialogContentText>
                                        <FormattedMessage
                                            module="contribution"
                                            id="saveContributionDialog.messageLower"
                                        />
                                    </DialogContentText>
                                )
                            }
                            {
                                step === 2 && (
                                    <DialogContentText>
                                        <FormattedMessage
                                            module="contribution"
                                            id="saveContributionDialog.messageLowerConfirm"
                                        />
                                    </DialogContentText>
                                )
                            }
                        </>
                    )
                }
                {
                    amount === policyValue && (
                        <DialogContentText>
                            {
                                <FormattedMessage
                                    module="contribution"
                                    id="saveContributionDialog.messageEqual"
                                />
                            }
                        </DialogContentText>
                    )
                }
                {
                    installmentsNumber >= max_installments && max_installments !== null && (
                        <DialogContentText>
                            <FormattedMessage
                                module="contribution"
                                id="contribution.saveContributionDialog.maxINstallments.message"
                            />
                        </DialogContentText>
                    )
                }
            </DialogContent>
            <DialogActions>

                {
                    amount === policyValue && (
                        <Button onClick={e => onConfirm()} className={classes.primaryButton} autoFocus>
                            <FormattedMessage module="contribution" id="saveContributionDialog.ok.button" />
                        </Button>
                    )
                }

                {
                    amount < policyValue && (
                        <>
                            {
                                step === 1 && (
                                    <Button onClick={e => setStep(2)} className={classes.primaryButton} autoFocus>
                                        <FormattedMessage module="contribution" id="saveContributionDialog.ok.button" />
                                    </Button>
                                )
                            }
                            {
                                step === 2 && (
                                    <>
                                        <Button onClick={e => onConfirm('ENFORCE')} className={classes.primaryButton} autoFocus>
                                            <FormattedMessage module="contribution" id="saveContributionDialog.yes.button" />
                                        </Button>
                                        <Button onClick={e => onConfirm('WAIT')} className={classes.primaryButton} autoFocus>
                                            <FormattedMessage module="contribution" id="saveContributionDialog.no.button" />
                                        </Button>
                                    </>
                                )
                            }
                        </>
                    )
                }
                {
                    step === 1 && (
                        <Button onClick={onCancel} className={classes.secondaryButton} >
                            <FormattedMessage module="core" id="cancel" />
                        </Button>
                    )
                }
            </DialogActions>
        </Dialog>
    );
}

export default injectIntl(withTheme(withStyles(styles)(SaveContributionDialog)));
