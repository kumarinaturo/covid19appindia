const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
var moment = require('moment');
const axios = require('axios');
app.get('/indianStats', function (req, res) {
    var response = {};

    var time;
    var confirmed;
    var death;
    var recovered;
    var todayConfirmed;
    var stateData = [];
    var todayDeath;
    var todayRecovered;
    axios.all([
        axios.get('https://api.covid19india.org/data.json'),
        axios.get('https://api.covid19india.org/state_district_wise.json')])
        .then(axios.spread((data, distData) => {
            var finalData = data.data;
            var districtData = distData.data;
            var confirmedGraph = [];
            var recoveredGraph = [];
            var deathGraph = [];
            finalData.cases_time_series = finalData.cases_time_series.map(elm => {
                if (moment(elm.date + '2020', 'DD MMMM YYYY').isAfter(moment('2020-03-01', 'YYYY-MM-DD'))) {
                    confirmedGraph.push(+(elm.dailyconfirmed + '.1'));
                    recoveredGraph.push(+(elm.dailyrecovered + '.1'));
                    deathGraph.push(+(elm.dailydeceased + '.1'));
                }

                return elm;
            })
            confirmedGraph = confirmedGraph.slice(Math.max(confirmedGraph.length - 12, 1))
            recoveredGraph = recoveredGraph.slice(Math.max(recoveredGraph.length - 12, 1));
            deathGraph = deathGraph.slice(Math.max(deathGraph.length - 12, 1))
            finalData.statewise = finalData.statewise.map(element => {
                if (element.statecode == 'TT') {
                    time = element.lastupdatedtime;
                    confirmed = element.confirmed;
                    recovered = element.recovered;
                    death = element.deaths;
                    todayConfirmed = element.deltaconfirmed.toString();
                    todayRecovered = element.deltarecovered.toString();
                    todayDeath = element.deltadeaths.toString();
                }
                else {
                    let district = [];
                    if (districtData[element.state])
                    {
                        for (let key in districtData[element.state].districtData) {
                            district.push({
                                name: key,
                                count: districtData[element.state].districtData[key].confirmed.toString(),
                                todayCount: districtData[element.state].districtData[key].delta.confirmed.toString()
                            });
                        }
                        district.sort(function(a, b){
                            return b.count-a.count
                        })
                    }
                        
                    stateData.push(
                        {
                            state: element.state,
                            showDistrict: false,
                            "totalDeath": element.deaths,
                            "totalConfirmed": element.confirmed,
                            "totalRecovered": element.recovered,
                            "todayDeath": element.deltadeaths.toString(),
                            "todayRecovered": element.deltarecovered.toString(),
                            "todayConfirmed": element.deltaconfirmed.toString(),
                            "districts": district
                        }
                    )
                }
                return element;

            });


            response = {
                time,
                confirmedGraph,
                recoveredGraph,
                deathGraph,
                confirmed,
                recovered,
                death,
                todayConfirmed,
                todayRecovered,
                todayDeath,
                stateData
            }
            res.send(response)

        }
        ))
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}
);
app.listen(port, () => console.log(`App listening at ${port}`))
