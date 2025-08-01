import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const ContributionsDistributionReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("contribution", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="product.ProductPicker"
          onChange={(product) => setValues({ ...values, product })}
          module="contribution"
          required
          value={values.product}
          label={formatMessage("ContributionsDistributionReport.product")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.YearPicker"
          onChange={(year) =>
            setValues({
                ...values,
                year,
          })}
          min={2010}
          max={2040}
          required
          withNull={false}
          value={values.year}
          label={formatMessage("ContributionsDistributionReport.year")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.MonthPicker"
          onChange={(month) =>
            setValues({
                ...values,
                month,
          })}
          withNull
          value={values.month}
        />
      </Grid>
    </Grid>
  );
};

export default ContributionsDistributionReport;
