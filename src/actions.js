import {
  graphql,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  formatJsonField,
  formatGQLString,
} from "@openimis/fe-core";
import _ from "lodash";
import _uuid from "lodash-uuid";

const CONTRIBUTION_FULL_PROJECTION = mm => [
  "id",
  "uuid",
  "payDate",
  "amount",
  "payType",
  "receipt",
  "isPhotoFee",
  "clientMutationId",
  `payer${mm.getProjection("payer.PayerPicker.projection")}`,
  `policy${mm.getProjection("policy.PolicyPicker.projection")}`,
  "networkOperator",
  "paymentNumber"
];

export function fetchPoliciesPremiums(mm, filters) {
  let payload = formatPageQueryWithCount("premiumsByPolicies",
    filters,
    [
      "id", "uuid", "payDate",
      `payer${mm.getProjection("payer.PayerPicker.projection")}`,
      "amount", "payType", "receipt", "isPhotoFee"]
  );
  return graphql(payload, 'CONTRIBUTION_POLICES_PREMIUMS');
}

export function fetchContributionsSummaries(mm, filters) {
  let projections = [
    "id",
    "uuid",
    "payDate",
    "amount",
    "payType",
    "receipt",
    "isPhotoFee",
    "clientMutationId",
    "validityTo",
    `payer${mm.getProjection("payer.PayerPicker.projection")}`,
  ];
  const payload = formatPageQueryWithCount("premiums",
    filters,
    projections
  );
  return graphql(payload, 'CONTRIBUTION_CONTRIBUTIONS');
}


export function selectPremium(premium) {
  return dispatch => {
    dispatch({ type: 'CONTRIBUTION_PREMIUM', payload: premium })
  }
}

export function formatContributionGQL(mm, contribution) {
  const req = `
    ${contribution.uuid !== undefined && contribution.uuid !== null ? `uuid: "${contribution.uuid}"` : ''}
    ${!!contribution.receipt ? `receipt: "${formatGQLString(contribution.receipt)}"` : ""}
    ${!!contribution.payDate ? `payDate: "${contribution.payDate}"` : ""}
    ${!!contribution.payType ? `payType: "${contribution.payType}"` : ""}
    ${`isPhotoFee: ${contribution.isPhotoFee}`}
    ${!!contribution.action ? `action: "${contribution.action}"` : ""}
    ${!!contribution.amount ? `amount: "${contribution.amount}"` : ""}
    ${!!contribution.payer ? `payerUuid: "${contribution.payer.uuid}"` : ""}
    ${!!contribution.jsonExt ? `jsonExt: ${formatJsonField(contribution.jsonExt)}` : ""}
    ${!!contribution.policy ? `policyUuid: "${formatGQLString(contribution.policy.uuid)}"` : ""}
    ${!!contribution.networkOperator ? `networkOperator: "${contribution.networkOperator}"` : ""}
    ${!!contribution.paymentNumber ? `paymentNumber: "${contribution.paymentNumber}"` : ""}
  `
  return req;
}
export function fetchPolicySummary(
  mm,
  policyUuid,
) {
  let filters = []
  if (!!policyUuid) {
    filters.push(`uuid: "${policyUuid}"`)
  }
  const payload = formatPageQuery("policies",
    filters,
    ["id", "uuid", "startDate", "product{name}", "expiryDate", "value"],
  );
  return graphql(payload, 'CONTRIBUTION_POLICY_SUMMARY');
}

export function fetchContribution(
  mm,
  contributionUuid,
  clientMutationId
) {
  let filters = []
  if (!!contributionUuid) {
    filters.push(`uuid: "${contributionUuid}"`)
  } else if (!!clientMutationId) {
    filters.push(`clientMutationId: "${clientMutationId}"`)
  }
  const payload = formatPageQuery("premiums",
    filters,
    CONTRIBUTION_FULL_PROJECTION(mm)
  );
  return graphql(payload, 'CONTRIBUTION_OVERVIEW',
    {
      clientMutationId: !contributionUuid && clientMutationId,
    });
}

export function newContribution() {
  return dispatch => {
    dispatch({ type: 'CONTRIBUTION_NEW' })
  }
}

export function createContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("createPremium", formatContributionGQL(mm, contribution), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_CREATE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime
    }
  )
}

export function updateContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("updatePremium", formatContributionGQL(mm, contribution), clientMutationLabel);
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_UPDATE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      contributionUuid: contribution.uuid,
    }
  )
}


export function deleteContribution(mm, contribution, clientMutationLabel) {
  let mutation = formatMutation("deletePremium", `uuids: ["${contribution.uuid}"]`, clientMutationLabel);
  contribution.clientMutationId = mutation.clientMutationId;
  var requestedDateTime = new Date();
  return graphql(
    mutation.payload,
    ['CONTRIBUTION_MUTATION_REQ', 'CONTRIBUTION_DELETE_RESP', 'CONTRIBUTION_MUTATION_ERR'],
    {
      clientMutationId: mutation.clientMutationId,
      clientMutationLabel,
      requestedDateTime,
      contributionUuid: contribution.uuid,
    }
  )
}
