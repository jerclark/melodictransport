/* get all series where the item code is alcohol beverages, dimensioned by reference person age (demographics code LB04 ) */
select cx_series.series_title, cx_data.*
from cx_series inner join cx_data on (cx_data.series_id = cx_series.series_id)
where cx_series.item_code = "ALCBEVG" and cx_series.demographics_code = "LB04"
