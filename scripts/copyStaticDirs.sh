mkdir dist || true
mkdir dist/covid-19-map-south-carolina || true
cp -r src/data src/static dist/covid-19-map-south-carolina
echo 'Copied static files.'