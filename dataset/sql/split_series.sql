select
    substr(series_id, 1, 2) as survey,
    substr(series_id, 3, 1) as seasonal_code,
    substr(series_id, 4, 7) as item_code,
    substr(series_id, 1, 2) as demographics_code,
    substr(series_id, 1, 2) as characteristics_code,
    substr(series_id, 1, 2) as process_code,


from cx_data


survey abbreviation =       CX
seasonal(code)      =       U
item_code       =       080110
demographics_code   =       LB01
characteristics_code    =       01
Process_code        =       M