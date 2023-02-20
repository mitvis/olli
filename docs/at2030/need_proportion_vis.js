
function toggle_data_table(button, data) {
    let table_el = $('#need-prop-table');
    if(button.getAttribute('aria-expanded') == "true") {
        table_el.html('');
        button.setAttribute('aria-expanded', 'false')
    } else {
        if(data.is_ok) {
            let table_data = data['data'];
            let html = '<table id="need-prop-table">';
            //Headings
            html += '<tr>';
            html += '<th>Study</th>';

            for(let series_info of table_data['series']) {
                html += `<th>${series_info.name}</th>`;
            }

            html += '</tr>';

            for(let i = 0; i < table_data['categories'].length; i++) {
                html += '<tr>';
                html += `<td><a href='${table_data['links'][i]}' target="_blank">${table_data['categories'][i]}</a></td>`;
                for(let series_info of table_data['series']) {
                    html += `<td>${round(series_info['data'][i]['y'])}% (${series_info['data'][i]['label']})</td>`
                }
                html += '</tr>';
            }
            html += '</table>';
            table_el.html(html);
        }
        button.setAttribute('aria-expanded', 'true');
    }

}

function get_need_prop_vis_description(need_prop_data) {
    let outcome_defs_str = '';
    let num_series = need_prop_data['data']['series'].length;
    for(let i = 0; i < num_series; i++) {
        outcome_defs_str += need_prop_data['data']['series'][i]['name'];
        if(i < num_series - 2) {
            outcome_defs_str += ', ';
        } else if (i < num_series - 1) {
            outcome_defs_str += ' and ';
        }
    }

    return `This figure compares the total ${outcome_defs_str} out of the ${need_prop_data['axis_label']}, `
            + `across each study setting reporting this type of indicator for ${need_prop_data['ap_type']}. These indicators are `
            + `represented proportionally on the bars to facilitate comparison, and they are also labelled with the `
            + `absolute number of individuals to consider the study size context. ${need_prop_data['blank_label']} implies the study `
            + `did not explicitly report the remainder of the indicator.`
}

function setup_vis(d) {
    need_prop_data = d;
    // add_alert('Data loaded.', $('#need-prop-alerts'), true);

    if(need_prop_data.is_ok) {
        // let height = 40 * need_prop_data['data']['categories'].length + 146;
        // $('#need-prop-vis').html(
        //     `<button id='need-prop-table-button' onclick="toggle_data_table(this, need_prop_data)" aria-haspopup="true" aria-expanded="false">Toggle data table</button>` +
        //     `<div id='need-prop-table'></div>` +
        //     `<figure class="highcharts-figure">` +
        //         `<div id="container" style="height: ${height}px"></div>` +
        //     `</figure>`
        //     // `<p class="highcharts-description">` +
        //     //     get_need_prop_vis_description(need_prop_data) +
        //     // `</p>`
        // );

        setup_highchart_vis(need_prop_data['data'], need_prop_data['axis_label']);
    } else {
        $('#need-prop-vis').html(`${need_prop_data.error}`);
        // $('#need-prop-vis').innerHTML = `<p>${data.error}</p>`;
    }
}

function round(num) {
    return Math.round((num + Number.EPSILON) * 10) / 10
}


function setup_highchart_vis(data, axis_label) {
    Highcharts.chart('container', {
        chart: {
            type: 'bar',
            description: 'This figure presents the indicator numerator (e.g. total with met need) out of a defined population denominator (e.g. total with an AP) for each study setting that reports that specific indicator type for a specific AP type. These indicators are represented proportionally on the horizontal bars for comparison and they are labelled with the absolute number of individuals for the added context of study sample size.'
        },
        title: {
            text: 'Assistive Product Access Indicators'
        },
        xAxis: {
            categories: data['categories'],
            title: {
                text: 'Study'
            },
            labels: {
                formatter: function () {
                    return `<a class='tick-label' href='${data['links'][this.pos]}' target="_blank">${this.value}</a>`;
                }
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: axis_label
            },
            reversedStacks: false
        },
        plotOptions: {
            series: {
                stacking: 'normal',
                dataLabels: {
                  enabled: true,

                  formatter: function() {return this.y == 0? "" : this.point.label},
                  inside: true,
                }
            },
        },
        tooltip: {
            useHTML: true,
            pointFormatter: function() {
                series = this.series,
                legendSymbol = `<span style="font-size: 0.5em; height:1em; width:1em; color:${series.color}; margin-right: 1em;"><i class="fas fa-circle"></i></span>`;
                return `<div style="display: flex; flex-direction: row; align-items: center;">${legendSymbol} <span>${series.name}: <b>${round(this.y)}% (${this.label})</b></span></div>`
            }
        },
        series: data['series'],
        accessibility: {
            valueSuffix: "%"
        }
    });
}