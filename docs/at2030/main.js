const need_prop_data = {
  "is_ok": true,
  "data": {
      "series": [
          {
              "data": [
                  {
                      "y": 51.5015015015015,
                      "label": 343
                  },
                  {
                      "y": 8.915304606240714,
                      "label": 60
                  },
                  {
                      "y": 9.898477157360407,
                      "label": 39
                  },
                  {
                      "y": 3.222094361334868,
                      "label": 28
                  },
                  {
                      "y": 17.647058823529413,
                      "label": 60
                  },
                  {
                      "y": 1.7751479289940828,
                      "label": 27
                  },
                  {
                      "y": 70,
                      "label": 315
                  },
                  {
                      "y": 5.86734693877551,
                      "label": 92
                  },
                  {
                      "y": 4.385277995301488,
                      "label": 56
                  },
                  {
                      "y": 67.82700421940928,
                      "label": 643
                  },
                  {
                      "y": 0.17462165308498254,
                      "label": 3
                  },
                  {
                      "y": 2.19435736677116,
                      "label": 7
                  },
                  {
                      "y": 33.93763596809282,
                      "label": 468
                  }
              ],
              "color": "#440154",
              "name": "Met"
          },
          {
              "data": [
                  {
                      "y": 48.4984984984985,
                      "label": 323
                  },
                  {
                      "y": 91.08469539375929,
                      "label": 613
                  },
                  {
                      "y": 90.1015228426396,
                      "label": 355
                  },
                  {
                      "y": 96.77790563866513,
                      "label": 841
                  },
                  {
                      "y": 82.35294117647058,
                      "label": 280
                  },
                  {
                      "y": 98.22485207100591,
                      "label": 1494
                  },
                  {
                      "y": 30,
                      "label": 135
                  },
                  {
                      "y": 94.13265306122449,
                      "label": 1476
                  },
                  {
                      "y": 95.61472200469852,
                      "label": 1221
                  },
                  {
                      "y": 32.17299578059072,
                      "label": 305
                  },
                  {
                      "y": 99.82537834691502,
                      "label": 1715
                  },
                  {
                      "y": 97.80564263322884,
                      "label": 312
                  },
                  {
                      "y": 66.06236403190718,
                      "label": 911
                  }
              ],
              "color": "#fde725",
              "name": "Unmet"
          }
      ],
      "categories": [
          "Lu et al. (2011): Yuhong, Shenyang Shi, Liaoning, China",
          "He et al. (2012): Dosso, Niger",
          "Chan et al. (2013): Zoba Ma'ekel, Eritrea",
          "Muhit et al. (2018): Sirajganj, Sirajganj, Rajshahi, Bangladesh",
          "Laviers et al. (2010): Kusini Unguja, Tanzania | Mjini Magharibi, Tanzania | Kaskazini Unguja, Tanzania",
          "He et al. (2012): Durban, eThekwini, KwaZulu-Natal, South Africa",
          "He et al. (2012): Los Angeles, Los Angeles County, California, United States",
          "He et al. (2012): Madurai, Tamil Nadu, India",
          "He et al. (2012): Kaski District, Gandaki, Nepal",
          "He et al. (2012): Guangzhou, Guangdong Shi, Guangdong Sheng, China",
          "He et al. (2012): Shunyi District, Beijing Shi, Beijing Shi, China",
          "Loughman et al. (2015): Nampula District, Nampula, Mozambique",
          "Luque et al. (2019): Bogotá, Bogotá, Colombia"
      ],
      "links": [
          "https://doi.org/10.1167/iovs.10-6569",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://pubmed.ncbi.nlm.nih.gov/23713915/",
          "https://doi.org/10.1080/09286586.2017.1370119",
          "https://doi.org/10.1167/iovs.08-3154",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1016/j.ajo.2012.01.026",
          "https://doi.org/10.1177%2F0145482X1510900304",
          "https://doi.org/10.1097/opx.0000000000001409"
      ]
  },
  "axis_label": "Total with need",
  "ap_type": "Near glasses",
  "blank_label": "No met"
}

const data = need_prop_data['data'];
const axis_label = need_prop_data['axis_label'];

const spec = {
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
};



  OlliAdapters.HighchartsAdapter(spec).then(olliVisSpec => {
    console.log('olliVisSpec', olliVisSpec)
    document.getElementById("at2030-olli").append(olli(olliVisSpec))
  })