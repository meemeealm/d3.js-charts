import pandas as pd
import json


sea_countries = [
    'Brunei Darussalam', 'Cambodia', 'Indonesia', 'Lao PDR', 
    'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 
    'Thailand', 'Timor-Leste', 'Vietnam', 'Viet nam'
]

def clean_and_extract_gdp(input_csv, output_json):
    df = pd.read_csv(input_csv, skiprows=4)

    # 1. Fix the double name for Vietnam
    # This standardizes 'Viet nam' to 'Vietnam'
    df['Country Name'] = df['Country Name'].replace({'Viet nam': 'Vietnam'})

    # 2. Filter the dataframe 
    df_sea = df[df['Country Name'].isin(sea_countries)]

    # 3. Identify year columns (e.g., '1960', '1961'...)
    year_columns = [col for col in df.columns if col.isdigit()]

    # 4. Melt the data
    df_long = df_sea.melt(
        id_vars=['Country Name', 'Country Code', 'Indicator Name'], 
        value_vars=year_columns,
        var_name='Year', 
        value_name='GDP'
    )

    # 5. Data Cleaning
    df_long['Year'] = df_long['Year'].astype(int)
    # Remove rows with NaN GDP so D3 lines don't break
    df_long = df_long.dropna(subset=['GDP'])

    # 6. Transform to Nested JSON 
    final_data = []
    for country in df_long['Country Name'].unique():
        country_subset = df_long[df_long['Country Name'] == country]
        
        country_obj = {
            "country": country,
            "code": country_subset['Country Code'].iloc[0],
            "values": country_subset[['Year', 'GDP']]
                .sort_values('Year')
                .rename(columns={'Year': 'x', 'GDP': 'y'}) # Renaming to x/y is common for D3
                .to_dict(orient='records')
        }
        final_data.append(country_obj)

    # 7. Export
    with open(output_json, 'w') as f:
        json.dump(final_data, f, indent=4)

    print(f"Extraction complete! {len(final_data)} SEA nations processed.")

# Run
clean_and_extract_gdp('./data/gdpdata.csv', 'sea_gdp_cleaned.json')