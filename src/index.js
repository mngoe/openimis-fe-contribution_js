import React from "react";
import { MonetizationOn } from "@material-ui/icons";
import { FormattedMessage } from "@openimis/fe-core";
import ContributionsPage from "./pages/ContributionsPage";
import ContributionPage from "./pages/ContributionPage";
import ContributionOverviewPage from "./pages/ContributionOverviewPage";
import PoliciesPremiumsOverview from "./components/PoliciesPremiumsOverview";
import PremiumPaymentTypePicker from "./pickers/PremiumPaymentTypePicker";
import PremiumPaymentOperatorPicker from "./pickers/PremiumPaymentOperatorPicker";
import PremiumCategoryPicker from "./pickers/PremiumCategoryPicker";
import messages_en from "./translations/en.json";
import messages_fr from "./translations/fr.json";
import reducer from "./reducer";

import { RIGHT_CONTRIBUTION } from "./constants";

const ROUTE_CONTRIBUTION_CONTRIBUTIONS = "contribution/contributions";
const ROUTE_CONTRIBUTION_CONTRIBUTION = "contribution/new";
const ROUTE_CONTRIBUTION_CONTRIBUTION_OVERVIEW = "contribution/overview";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: messages_en }, { key: "fr", messages: messages_fr }],
  "reducers": [{ key: 'contribution', reducer }],

  "refs": [

    { key: "contribution.PremiumPicker.projection", ref: ["id", "uuid", "receipt"] },
    { key: "contribution.PremiumPaymentTypePicker", ref: PremiumPaymentTypePicker },
    { key: "contribution.PremiumPaymentOperatorPicker", ref: PremiumPaymentOperatorPicker },
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