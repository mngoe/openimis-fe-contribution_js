import React, { Component } from "react";
import { ConstantBasedPicker } from "@openimis/fe-core";

import { PREMIUM_PAYMENT_OPERATORS } from "../constants";

class PremiumPaymentOperatorPicker extends Component {

    render() {
        return <ConstantBasedPicker
            module="contribution"
            label="Contribution.operator"
            constants={PREMIUM_PAYMENT_OPERATORS}
            {...this.props}
        />
    }
}

export default PremiumPaymentOperatorPicker;