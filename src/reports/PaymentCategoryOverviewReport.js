import { Grid } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";
import React from "react";

const PaymentCategoryOverviewReport = (props) => {
  const { values, setValues } = props;
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations("contribution", modulesManager);

  return (
    <Grid container direction="column" spacing={1}>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateStart}
          module="contribution"
          required
          label="PaymentCategoryOverviewReport.dateStart"
          onChange={(dateStart) => setValues({ ...values, dateStart })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="core.DatePicker"
          value={values.dateEnd}
          module="contribution"
          required
          label="PaymentCategoryOverviewReport.dateEnd"
          onChange={(dateEnd) => setValues({ ...values, dateEnd })}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(region) =>
            setValues({
                ...values,
                region,
                district:null,
          })}
          value={values.region}
          locationLevel={0}
          label={formatMessage("PaymentCategoryOverviewReport.region")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="location.LocationPicker"
          onChange={(district) =>
            setValues({
                ...values,
                district,
          })}
          value={values.district}
          parentLocation={values.region}
          locationLevel={1}
          label={formatMessage("PaymentCategoryOverviewReport.district")}
        />
      </Grid>
      <Grid item>
        <PublishedComponent
          pubRef="product.ProductPicker"
          onChange={(product) => setValues({ ...values, product })}
          module="contribution"
          value={values.product}
          label={formatMessage("PaymentCategoryOverviewReport.product")}
        />
      </Grid>
    </Grid>
  );
};

export default PaymentCategoryOverviewReport;
