import {
  parseData,
  pageInfo,
  formatServerError,
  formatGraphQLError,
  dispatchMutationResp,
  dispatchMutationErr,
  dispatchMutationReq,
} from "@openimis/fe-core";

function reducer(
  state = {
    fetchingPoliciesPremiums: false,
    fetchedPoliciesPremiums: false,
    errorPoliciesPremiums: null,
    policiesPremiumsPageInfo: { totalCount: 0 },
    policiesPremiums: null,
    premium: null,
    contributions: [],
    contributionsPageInfo: { totalCount: 0 },
    fetchingContributions: false,
    fetchedContributions: false,
    errorContributions: null,
    contribution: null,
    fetchingContribution: false,
    errorContribution: null,
    submittingMutation: false,
    mutation: {},
    policySummary: null,
    errorPolicySummary: null,
  },
  action
) {
  switch (action.type) {
    case "INSUREE_FAMILY_OVERVIEW_REQ":
      return {
        ...state,
        fetchingPoliciesPremiums: false,
        fetchedPoliciesPremiums: false,
        policiesPremiums: null,
        policiesPremiumsPageInfo: { totalCount: 0 },
        errorPoliciesPremiums: null,
        premium: null,
      };
    case "POLICY_INSUREE_POLICIES_REQ":
    case "POLICY_FAMILY_POLICIES_REQ":
      return {
        ...state,
        policiesPremiums: null,
        policiesPremiumsPageInfo: { totalCount: 0 },
        errorPoliciesPremiums: null,
        premium: null,
      };
    case "CONTRIBUTION_POLICES_PREMIUMS_REQ":
      return {
        ...state,
        fetchingPoliciesPremiums: true,
        fetchedPoliciesPremiums: false,
        policiesPremiums: null,
        policiesPremiumsPageInfo: { totalCount: 0 },
        errorPoliciesPremiums: null,
        premium: null,
      };
    case "CONTRIBUTION_POLICES_PREMIUMS_RESP":
      return {
        ...state,
        fetchingPoliciesPremiums: false,
        fetchedPoliciesPremiums: true,
        policiesPremiums: parseData(action.payload.data.premiumsByPolicies),
        policiesPremiumsPageInfo: pageInfo(
          action.payload.data.premiumsByPolicies
        ),
        errorPoliciesPremiums: formatGraphQLError(action.payload),
      };
    case "CONTRIBUTION_POLICES_PREMIUMS_ERR":
      return {
        ...state,
        fetchingPoliciesPremiums: false,
        errorPoliciesPremiums: formatServerError(action.payload),
      };
    case "CONTRIBUTION_PREMIUM":
      return {
        ...state,
        premium: action.payload,
      };
    case "CONTRIBUTION_CONTRIBUTIONS_REQ":
      return {
        ...state,
        fetchingContributions: true,
        fetchedContributions: false,
        contributions: null,
        contributionsPageInfo: { totalCount: 0 },
        errorContributions: null,
      };
    case "CONTRIBUTION_CONTRIBUTIONS_ERR":
      return {
        ...state,
        fetchingContributions: false,
        errorContributions: formatServerError(action.payload),
      };
    case "CONTRIBUTION_CONTRIBUTIONS_RESP":
      return {
        ...state,
        fetchingContributions: false,
        fetchedContributions: true,
        contributions: parseData(action.payload.data.premiums),
        contributionsPageInfo: pageInfo(action.payload.data.premiums),
        errorContributions: formatGraphQLError(action.payload),
      };
    case "CONTRIBUTION_POLICY_SUMMARY_REQ":
      return {
        ...state,
        fetchingPolicySummary: true,
        fetchedPolicySummary: false,
        policySummary: null,
        errorPolicySummary: null,
      };
    case "CONTRIBUTION_POLICY_SUMMARY_RESP":
      var policies = parseData(action.payload.data.policies);
      let policySummary = null;
      if (!!policies && policies.length > 0) {
        policySummary = policies[0];
      }
      return {
        ...state,
        policySummary,
        fetchingPolicySummary: false,
        fetchedPolicySummary: true,
        errorPolicySummary: formatGraphQLError(action.payload),
      };
    case "CONTRIBUTION_POLICY_SUMMARY_ERR":
      return {
        ...state,
        fetchingPolicySummary: false,
        errorPolicySummary: formatServerError(action.payload),
      };
    case "CONTRIBUTION_OVERVIEW_REQ":
      return {
        ...state,
        fetchingContribution: true,
        fetchedContribution: false,
        contribution: null,
        errorContribution: null,
      };
    case "CONTRIBUTION_OVERVIEW_RESP":
      var contributions = parseData(action.payload.data.premiums);
      let contribution = null;
      if (!!contributions && contributions.length > 0) {
        contribution = contributions[0];
      }
      return {
        ...state,
        fetchingContribution: false,
        fetchedContribution: true,
        contribution,
        errorContribution: formatGraphQLError(action.payload),
      };
    case "CONTRIBUTION_OVERVIEW_ERR":
      return {
        ...state,
        fetchingContribution: false,
        errorContribution: formatServerError(action.payload),
      };
    case "CONTRIBUTION_NEW":
      return {
        ...state,
        contributionsPageInfo: { totalCount: 0 },
        contribution: null,
      };
    case "CONTRIBUTION_OVERVIEW_CLEAR":
      return {
        ...state,
        fetchingContribution: false,
        fetchedContribution: false,
        contribution: null,
        errorContribution: null,
      };
    case "CONTRIBUTION_FIELDS_VALIDATION_REQ":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          contributionReceipt: {
            isValidating: true,
            isValid: false,
            validationError: null,
          },
        },
      };
    case "CONTRIBUTION_FIELDS_VALIDATION_RESP":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          contributionReceipt: {
            isValidating: false,
            isValid: action.payload?.data.isValid,
            validationError: formatGraphQLError(action.payload),
          },
        },
      };
    case "CONTRIBUTION_FIELDS_VALIDATION_ERR":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          contributionReceipt: {
            isValidating: false,
            isValid: false,
            validationError: formatServerError(action.payload),
          },
        },
      };
    case "CONTRIBUTION_FIELDS_VALIDATION_CLEAR":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          contributionReceipt: {
            isValidating: true,
            isValid: false,
            validationError: null,
          },
        },
      };
    case "CONTRIBUTION_FIELDS_VALIDATION_SET_VALID":
      return {
        ...state,
        validationFields: {
          ...state.validationFields,
          contributionReceipt: {
            isValidating: false,
            isValid: true,
            validationError: null,
          },
        },
      };
    case "CONTRIBUTION_MUTATION_REQ":
      return dispatchMutationReq(state, action);
    case "CONTRIBUTION_MUTATION_ERR":
      return dispatchMutationErr(state, action);
    case "CONTRIBUTION_UPDATE_RESP":
      return dispatchMutationResp(state, "updatePremium", action);
    case "CONTRIBUTION_DELETE_RESP":
      return dispatchMutationResp(state, "deletePremium", action);
    case "CONTRIBUTION_CREATE_RESP":
      return dispatchMutationResp(state, "createPremium", action);
    default:
      return state;
  }
}

export default reducer;
