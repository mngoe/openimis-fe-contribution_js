import React from "react";
import { MonetizationOn } from "@material-ui/icons";
import { FormattedMessage, decodeId } from "@openimis/fe-core";
import ContributionsPage from "./pages/ContributionsPage";
import ContributionPage from "./pages/ContributionPage";
import ContributionOverviewPage from "./pages/ContributionOverviewPage";
import PoliciesPremiumsOverview from "./components/PoliciesPremiumsOverview";
import PremiumPaymentTypePicker from "./pickers/PremiumPaymentTypePicker";
import PremiumCategoryPicker from "./pickers/PremiumCategoryPicker";
import messages_en from "./translations/en.json";
import reducer from "./reducer";

import { RIGHT_CONTRIBUTION } from "./constants";
import PremiumCollectionReport from "./reports/PremiumCollectionReport";
import PaymentCategoryOverviewReport from "./reports/PaymentCategoryOverviewReport";
import ContributionsDistributionReport from "./reports/ContributionsDistribution";

const ROUTE_CONTRIBUTION_CONTRIBUTIONS = "contribution/contributions";
const ROUTE_CONTRIBUTION_CONTRIBUTION = "contribution/new";
const ROUTE_CONTRIBUTION_CONTRIBUTION_OVERVIEW = "contribution/overview";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }],
  "reducers": [{ key: 'contribution', reducer }],
  "reports": [
    {
      key: "premium_collection",
      component: PremiumCollectionReport,
      isValid: (values) => values.dateStart && values.dateEnd,
      getParams: (values) => {
        const params = {}
        if (values.region) {
          params.requested_region_id = decodeId(values.region.id);
        }
        if (values.district) {
          params.requested_district_id = decodeId(values.district.id);
        }
        if (values.product) {
          params.requested_product_id = decodeId(values.product.id);
        }
        if (values.paymentType) {
          params.requested_payment_type = values.paymentType;
        }
        params.date_start = values.dateStart;
        params.date_end = values.dateEnd;
        return params;
      },
    },
    {
      key: "payment_category_overview",
      component: PaymentCategoryOverviewReport,
      isValid: (values) => values.dateStart && values.dateEnd,
      getParams: (values) => {
        const params = {}
        if (values.region) {
          params.requested_region_id = decodeId(values.region.id);
        }
        if (values.district) {
          params.requested_district_id = decodeId(values.district.id);
        }
        if (values.product) {
          params.requested_product_id = decodeId(values.product.id);
        }
        params.date_start = values.dateStart;
        params.date_end = values.dateEnd;
        return params;
      },
    },
    {
      key: "contributions_distribution",
      component: ContributionsDistributionReport,
      isValid: (values) => values.product && values.year,
      getParams: (values) => {
        const params = {}
        if (values.region) {
          params.requested_region_id = decodeId(values.region.id);
        }
        if (values.district) {
          params.requested_district_id = decodeId(values.district.id);
        }
        if (values.month) {
          params.requested_month = values.month;
        }
        params.requested_product_id = decodeId(values.product.id);
        params.requested_year = values.year;
        return params;
      },
    },
  ],
  "refs": [

    { key: "contribution.PremiumPicker.projection", ref: ["id", "uuid", "receipt"] },
    { key: "contribution.PremiumPaymentTypePicker", ref: PremiumPaymentTypePicker },
    { key: "contribution.PremiumCategoryPicker", ref: PremiumCategoryPicker },
    { key: "contribution.contributions", ref: ROUTE_CONTRIBUTION_CONTRIBUTIONS },
    { key: "contribution.contributionNew", ref: ROUTE_CONTRIBUTION_CONTRIBUTION },
    { key: "contribution.contributionOverview", ref: ROUTE_CONTRIBUTION_CONTRIBUTION_OVERVIEW },
  ],
  "core.Router": [
    { path: ROUTE_CONTRIBUTION_CONTRIBUTIONS, component: ContributionsPage },
    { path: ROUTE_CONTRIBUTION_CONTRIBUTION + "/:policy_uuid", component: ContributionPage },
    { path: ROUTE_CONTRIBUTION_CONTRIBUTION_OVERVIEW + "/:contribution_uuid", component: ContributionOverviewPage },
  ],
  "insuree.MainMenu": [
    {
      text: <FormattedMessage module="contribution" id="menu.contributions" />,
      icon: <MonetizationOn />,
      route: "/" + ROUTE_CONTRIBUTION_CONTRIBUTIONS,
      filter: rights => rights.includes(RIGHT_CONTRIBUTION)
    }
  ],
  "insuree.FamilyOverview.panels": [PoliciesPremiumsOverview],
}

export const ContributionModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
}