import { PlotAdapter } from "../../Adapters/ObservablePlotAdapter";
import { Axis, Chart, FacetedChart, Legend, OlliVisSpec } from "../../Adapters/Types";
// @ts-ignore
import * as Plot from "@observablehq/plot";

const letterData = [
    { letter: 'E', freq: 0.12702, vowel: true },
    { letter: 'T', freq: 0.09056, vowel: false },
    { letter: 'A', freq: 0.08167, vowel: true },
    { letter: 'O', freq: 0.07507, vowel: true },
    { letter: 'I', freq: 0.06966, vowel: true },
    { letter: 'N', freq: 0.06749, vowel: false },
    { letter: 'S', freq: 0.06327, vowel: false },
    { letter: 'H', freq: 0.06094, vowel: false },
    { letter: 'R', freq: 0.05987, vowel: false },
    { letter: 'D', freq: 0.04253, vowel: false },
    { letter: 'L', freq: 0.04025, vowel: false },
    { letter: 'C', freq: 0.02782, vowel: false },
    { letter: 'U', freq: 0.02758, vowel: true },
    { letter: 'M', freq: 0.02406, vowel: false },
    { letter: 'W', freq: 0.0236, vowel: false },
    { letter: 'F', freq: 0.02288, vowel: false },
    { letter: 'G', freq: 0.02015, vowel: false },
    { letter: 'Y', freq: 0.01974, vowel: false },
    { letter: 'P', freq: 0.01929, vowel: false },
    { letter: 'B', freq: 0.01492, vowel: false },
    { letter: 'V', freq: 0.00978, vowel: false },
    { letter: 'K', freq: 0.00772, vowel: false },
    { letter: 'J', freq: 0.00153, vowel: false },
    { letter: 'X', freq: 0.0015, vowel: false },
    { letter: 'Q', freq: 0.00095, vowel: false },
    { letter: 'Z', freq: 0.00074, vowel: false }
]

const athleteData = [
    {
        "id": 736041664,
        "name": "A Jesus Garcia",
        "nationality": "ESP",
        "sex": "male",
        "date_of_birth": "1969-10-17T00:00:00.000Z",
        "height": 1.72,
        "weight": 64,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 532037425,
        "name": "A Lam Shin",
        "nationality": "KOR",
        "sex": "female",
        "date_of_birth": "1986-09-23T00:00:00.000Z",
        "height": 1.68,
        "weight": 56,
        "sport": "fencing",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 435962603,
        "name": "Aaron Brown",
        "nationality": "CAN",
        "sex": "male",
        "date_of_birth": "1992-05-27T00:00:00.000Z",
        "height": 1.98,
        "weight": 79,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 1,
        "info": null
    },
    {
        "id": 521041435,
        "name": "Aaron Cook",
        "nationality": "MDA",
        "sex": "male",
        "date_of_birth": "1991-01-02T00:00:00.000Z",
        "height": 1.83,
        "weight": 80,
        "sport": "taekwondo",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 33922579,
        "name": "Aaron Gate",
        "nationality": "NZL",
        "sex": "male",
        "date_of_birth": "1990-11-26T00:00:00.000Z",
        "height": 1.81,
        "weight": 71,
        "sport": "cycling",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 173071782,
        "name": "Aaron Royle",
        "nationality": "AUS",
        "sex": "male",
        "date_of_birth": "1990-01-26T00:00:00.000Z",
        "height": 1.8,
        "weight": 67,
        "sport": "triathlon",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 266237702,
        "name": "Aaron Russell",
        "nationality": "USA",
        "sex": "male",
        "date_of_birth": "1993-06-04T00:00:00.000Z",
        "height": 2.05,
        "weight": 98,
        "sport": "volleyball",
        "gold": 0,
        "silver": 0,
        "bronze": 1,
        "info": null
    },
    {
        "id": 382571888,
        "name": "Aaron Younger",
        "nationality": "AUS",
        "sex": "male",
        "date_of_birth": "1991-09-25T00:00:00.000Z",
        "height": 1.93,
        "weight": 100,
        "sport": "aquatics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 87689776,
        "name": "Aauri Lorena Bokesa",
        "nationality": "ESP",
        "sex": "female",
        "date_of_birth": "1988-12-14T00:00:00.000Z",
        "height": 1.8,
        "weight": 62,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 997877719,
        "name": "Ababel Yeshaneh",
        "nationality": "ETH",
        "sex": "female",
        "date_of_birth": "1991-07-22T00:00:00.000Z",
        "height": 1.65,
        "weight": 54,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 343694681,
        "name": "Abadi Hadis",
        "nationality": "ETH",
        "sex": "male",
        "date_of_birth": "1997-11-06T00:00:00.000Z",
        "height": 1.7,
        "weight": 63,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 591319906,
        "name": "Abbas Abubakar Abbas",
        "nationality": "BRN",
        "sex": "male",
        "date_of_birth": "1996-05-17T00:00:00.000Z",
        "height": 1.75,
        "weight": 66,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 258556239,
        "name": "Abbas Qali",
        "nationality": "IOA",
        "sex": "male",
        "date_of_birth": "1992-10-11T00:00:00.000Z",
        "height": null,
        "weight": null,
        "sport": "aquatics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 376068084,
        "name": "Abbey D'Agostino",
        "nationality": "USA",
        "sex": "female",
        "date_of_birth": "1992-05-25T00:00:00.000Z",
        "height": 1.61,
        "weight": 49,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 162792594,
        "name": "Abbey Weitzeil",
        "nationality": "USA",
        "sex": "female",
        "date_of_birth": "1996-12-03T00:00:00.000Z",
        "height": 1.78,
        "weight": 68,
        "sport": "aquatics",
        "gold": 1,
        "silver": 1,
        "bronze": 0,
        "info": null
    },
    {
        "id": 521036704,
        "name": "Abbie Brown",
        "nationality": "GBR",
        "sex": "female",
        "date_of_birth": "1996-04-10T00:00:00.000Z",
        "height": 1.76,
        "weight": 71,
        "sport": "rugby sevens",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 149397772,
        "name": "Abbos Rakhmonov",
        "nationality": "UZB",
        "sex": "male",
        "date_of_birth": "1998-07-07T00:00:00.000Z",
        "height": 1.61,
        "weight": 57,
        "sport": "wrestling",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 256673338,
        "name": "Abbubaker Mobara",
        "nationality": "RSA",
        "sex": "male",
        "date_of_birth": "1994-02-18T00:00:00.000Z",
        "height": 1.75,
        "weight": 64,
        "sport": "football",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 337369662,
        "name": "Abby Erceg",
        "nationality": "NZL",
        "sex": "female",
        "date_of_birth": "1989-11-20T00:00:00.000Z",
        "height": 1.75,
        "weight": 68,
        "sport": "football",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 334169879,
        "name": "Abd Elhalim Mohamed Abou",
        "nationality": "EGY",
        "sex": "male",
        "date_of_birth": "1989-06-03T00:00:00.000Z",
        "height": 2.1,
        "weight": 88,
        "sport": "volleyball",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 215053268,
        "name": "Abdalaati Iguider",
        "nationality": "MAR",
        "sex": "male",
        "date_of_birth": "1987-03-25T00:00:00.000Z",
        "height": 1.73,
        "weight": 57,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 763711985,
        "name": "Abdalelah Haroun",
        "nationality": "QAT",
        "sex": "male",
        "date_of_birth": "1997-01-01T00:00:00.000Z",
        "height": 1.85,
        "weight": 80,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 924593601,
        "name": "Abdalla Targan",
        "nationality": "SUD",
        "sex": "male",
        "date_of_birth": "1996-09-28T00:00:00.000Z",
        "height": 1.77,
        "weight": 65,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 578032534,
        "name": "Abdel Aziz Mehelba",
        "nationality": "EGY",
        "sex": "male",
        "date_of_birth": "1988-12-10T00:00:00.000Z",
        "height": 1.76,
        "weight": 80,
        "sport": "shooting",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 890222258,
        "name": "Abdelati El Guesse",
        "nationality": "MAR",
        "sex": "male",
        "date_of_birth": "1993-02-27T00:00:00.000Z",
        "height": 1.9,
        "weight": 72,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 803161695,
        "name": "Abdelaziz Merzougui",
        "nationality": "ESP",
        "sex": "male",
        "date_of_birth": "1991-08-30T00:00:00.000Z",
        "height": 1.75,
        "weight": 67,
        "sport": "athletics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    },
    {
        "id": 189931373,
        "name": "Abdelaziz Mohamed Ahmed",
        "nationality": "SUD",
        "sex": "male",
        "date_of_birth": "1994-10-12T00:00:00.000Z",
        "height": 1.81,
        "weight": 72,
        "sport": "aquatics",
        "gold": 0,
        "silver": 0,
        "bronze": 0,
        "info": null
    }];


describe("Tests for the ObservablePlot Adapter on a Simple Bar Chart", () => {

    let p = {
        marks: [
            Plot.barY(letterData, { x: "letter", y: "freq", fill: "steelblue" }),
        ]
    }

    const plotVisSpec: Chart = PlotAdapter(p, Plot.plot(p)) as Chart;

    test("Testing description generation", () => {
        expect(plotVisSpec.description).toBe('Bar chart with an X-Axis.');
    });

    test("Testing fields used", () => {
        expect(plotVisSpec.dataFieldsUsed).toContain(['letter', 'freq']);
    });

    test("Testing Guide generation", () => {
        const expectedAxis: Axis = {
            values: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            title: 'X-Axis',
            data: letterData,
            field: 'letter',
            markUsed: 'rect',
            scaleType: 'band',
            orient: 'bottom'
        }
        expect(plotVisSpec.axes).toBe([expectedAxis]);
    });

    test("Testing data used", () => {
        expect(plotVisSpec.data).toBe(letterData);
    });

    test("Making sure no grid nodes exist", () => {
        expect(plotVisSpec.gridNodes).toBe([]);
    });

    test("Making sure no legends exist", () => {
        expect(plotVisSpec.legends).toBe([]);
    });
})

describe("Tests for the ObservablePlot Adapter on a Scatterplot", () => {

    let p = {
        color: {
            legend: true
        },
        marks: [
            Plot.dot(letterData, { x: "letter", y: "freq", fill: "vowel" }),
            Plot.ruleY([0])
        ]
    }

    const plotVisSpec: Chart = PlotAdapter(p, Plot.plot(p)) as Chart;

    test("Testing description generation", () => {
        expect(plotVisSpec.description).toBe('Scatterplot with an X-Axis, Y-Axis, and Legend.');
    });

    test("Testing fields used", () => {
        expect(plotVisSpec.dataFieldsUsed).toContain(['letter', 'freq', 'vowel']);
    });

    test("Testing Guide generation", () => {
        const expectedXAxis: Axis = {
            values: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
            title: 'Y-Axis',
            data: letterData,
            field: 'letter',
            markUsed: 'rect',
            scaleType: 'band',
            orient: 'bottom'
        }

        const expectedYAxis: Axis = {
            values: [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12],
            title: 'Y-Axis',
            data: letterData,
            field: 'letter',
            markUsed: 'rect',
            scaleType: 'band',
            orient: 'left'
        }

        expect(plotVisSpec.axes).toBe([expectedXAxis, expectedYAxis]);
    });

    test("Testing data used", () => {
        expect(plotVisSpec.data).toBe(letterData);
    });

    test("Making sure no grid nodes exist", () => {
        expect(plotVisSpec.gridNodes).toBe([]);
    });

    test("Making sure no legends exist", () => {

        const expectedLegend: Legend = {
            type: 'nominal',
            data: letterData,
            field: 'vowel',
            title: 'Legend',
            values: ['Not Vowel', 'Vowel']
        }

        expect(plotVisSpec.legends).toBe([expectedLegend]);
    });

})

describe("Tests for the ObservablePlot Adapter on a Faceted Bar Chart", () => {

    const p = {
        grid: true,
        facet: {
            data: athleteData,
            y: "sex"
        },
        marks: [
            Plot.rectY(athleteData, Plot.binX({ y: "count" }, { x: "weight", fill: "sex", stroke: 'black' })),
            Plot.ruleY([0])
        ]
    }

    const plotVisSpec: FacetedChart = PlotAdapter(p, Plot.plot(p)) as FacetedChart;

    test("Testing description generation", () => {
        expect(plotVisSpec.description).toBe('Faceted Bar chart with two nested charts.');
    });

    test("Testing fields used", () => {
        expect(plotVisSpec.dataFieldsUsed).toContain(['weight', 'sex']);
    });

    test('Checking number of nested charts', () => {
        expect(plotVisSpec.charts.length).toBe(2);
    })

    test("Testing Guide generation", () => {
        const expectedAxis: Axis = {
            values: [40, 50, 60, 70, 80, 90, 100, 110, 120],
            title: 'X-Axis',
            data: athleteData,
            field: 'weight',
            markUsed: 'rect',
            scaleType: 'band',
            orient: 'bottom'
        }
        expect(plotVisSpec.charts[0].axes).toBe([expectedAxis]);
    });

    test("Testing data used", () => {
        expect(plotVisSpec.data).toBe(athleteData);
    });

    test("Making sure no grid nodes exist", () => {
        expect(plotVisSpec.charts[0].gridNodes).toBe([]);
    });

    test("Making sure no legends exist", () => {
        expect(plotVisSpec.charts[0].legends).toBe([]);
    });
})