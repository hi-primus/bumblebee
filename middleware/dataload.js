import axios from 'axios';

export default function( { params, store} ){

  let dataset = {
    "columns": {
      "GeoLocation": {
        "column_type": "categorical",
        "frequency": [{
            "count": 1,
            "percentage": 0.00219,
            "value": "(-31.416670, -60.666670)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(39.800000, 16.200000)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(38.400000, -84.250000)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(14.883330, 75.600000)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(45.816670, 44.633330)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(49.983330, 7.533330)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(50.383330, -3.950000)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(27.524170, 3.796940)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(-76.687870, 159.358460)"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "(-76.843570, 156.240420)"
          }
        ],
        "name": "GeoLocation",
        "stats": {
          "missing_count": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "uniques_count": 0
        }
      },
      "fall": {
        "column_type": "categorical",
        "frequency": [{
            "count": 44609,
            "percentage": 97.57853,
            "value": "Found"
          },
          {
            "count": 1107,
            "percentage": 2.42147,
            "value": "Fell"
          }
        ],
        "name": "fall",
        "stats": {
          "missing_count": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "uniques_count": 0
        }
      },
      "id": {
        "column_type": "numeric",
        "dtypes_stats": {
          "bool": 0,
          "date": 0,
          "float": 0,
          "int": 45716,
          "missing": 0,
          "null": 0,
          "string": 0
        },
        "frequency": [{
            "count": 1,
            "percentage": 0.00219,
            "value": "2294"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "4937"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "5325"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "12394"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "16974"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "23097"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "296"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "467"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "675"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "691"
          }
        ],
        "hist": [{
            "lower": 1.0,
            "upper": 2873.85,
            "value": 0
          },
          {
            "lower": 2873.85,
            "upper": 5746.7,
            "value": 2505
          },
          {
            "lower": 5746.7,
            "upper": 8619.55,
            "value": 2084
          },
          {
            "lower": 8619.55,
            "upper": 11492.4,
            "value": 2844
          },
          {
            "lower": 11492.4,
            "upper": 14365.25,
            "value": 2837
          },
          {
            "lower": 14365.25,
            "upper": 17238.1,
            "value": 2831
          },
          {
            "lower": 17238.1,
            "upper": 20110.949999999997,
            "value": 2829
          },
          {
            "lower": 20110.949999999997,
            "upper": 22983.799999999996,
            "value": 2843
          },
          {
            "lower": 22983.799999999996,
            "upper": 25856.649999999994,
            "value": 2869
          },
          {
            "lower": 25856.649999999994,
            "upper": 28729.499999999993,
            "value": 2664
          },
          {
            "lower": 28729.499999999993,
            "upper": 31602.34999999999,
            "value": 2268
          },
          {
            "lower": 31602.34999999999,
            "upper": 34475.19999999999,
            "value": 2446
          },
          {
            "lower": 34475.19999999999,
            "upper": 37348.04999999999,
            "value": 1292
          },
          {
            "lower": 37348.04999999999,
            "upper": 40220.89999999999,
            "value": 2254
          },
          {
            "lower": 40220.89999999999,
            "upper": 43093.749999999985,
            "value": 1392
          },
          {
            "lower": 43093.749999999985,
            "upper": 45966.599999999984,
            "value": 392
          },
          {
            "lower": 45966.599999999984,
            "upper": 48839.44999999998,
            "value": 1486
          },
          {
            "lower": 48839.44999999998,
            "upper": 51712.29999999998,
            "value": 2694
          },
          {
            "lower": 51712.29999999998,
            "upper": 54585.14999999998,
            "value": 2403
          },
          {
            "lower": 54585.14999999998,
            "upper": 57457.99999999998,
            "value": 2241
          }
        ],
        "name": "id",
        "stats": {
          "coef_variation": 0.62703,
          "interquartile_range": 27968.0,
          "kurtosis": -1.1602608393254032,
          "mad": 13263.0,
          "max": 57458.0,
          "mean": 26889.73510368361,
          "median": 24261.0,
          "min": 1.0,
          "missing_count": 0,
          "na": 0,
          "p_missing": 0.0,
          "p_uniques": 97.8,
          "quantile": {
            "0.05": 2434.0,
            "0.25": 12688.0,
            "0.5": 24261.0,
            "0.75": 40656.0,
            "0.95": 54892.0
          },
          "range": 57457.0,
          "skewness": 0.26653721939302294,
          "stddev": 16860.68303027627,
          "sum": 1229291130.0,
          "uniques_count": 44709,
          "variance": 284282632.2474462,
          "zeros": 0
        }
      },
      "mass (g)": {
        "column_type": "numeric",
        "dtypes_stats": {
          "bool": 0,
          "date": 0,
          "float": 32526,
          "int": 13059,
          "missing": 0,
          "null": 131,
          "string": 0
        },
        "frequency": [{
            "count": 51,
            "percentage": 0.11156,
            "value": "8.5"
          },
          {
            "count": 38,
            "percentage": 0.08312,
            "value": "10.7"
          },
          {
            "count": 4,
            "percentage": 0.00875,
            "value": "691"
          },
          {
            "count": 4,
            "percentage": 0.00875,
            "value": "110.9"
          },
          {
            "count": 3,
            "percentage": 0.00656,
            "value": "467"
          },
          {
            "count": 3,
            "percentage": 0.00656,
            "value": "119.8"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "45300"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "483.7"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "16250"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "150200"
          }
        ],
        "hist": [{
            "lower": 0.0,
            "upper": 3000000.0,
            "value": 0
          },
          {
            "lower": 3000000.0,
            "upper": 6000000.0,
            "value": 45564
          },
          {
            "lower": 6000000.0,
            "upper": 9000000.0,
            "value": 5
          },
          {
            "lower": 9000000.0,
            "upper": 12000000.0,
            "value": 2
          },
          {
            "lower": 12000000.0,
            "upper": 15000000.0,
            "value": 2
          },
          {
            "lower": 15000000.0,
            "upper": 18000000.0,
            "value": 2
          },
          {
            "lower": 18000000.0,
            "upper": 21000000.0,
            "value": 3
          },
          {
            "lower": 21000000.0,
            "upper": 24000000.0,
            "value": 2
          },
          {
            "lower": 24000000.0,
            "upper": 27000000.0,
            "value": 2
          },
          {
            "lower": 27000000.0,
            "upper": 30000000.0,
            "value": 1
          },
          {
            "lower": 30000000.0,
            "upper": 33000000.0,
            "value": 2
          }
        ],
        "name": "mass (g)",
        "stats": {
          "coef_variation": 43.30362,
          "interquartile_range": 195.4,
          "kurtosis": 6796.17060791067,
          "mad": 30.5,
          "max": 60000000.0,
          "mean": 13278.078548580497,
          "median": 32.6,
          "min": 0.0,
          "missing_count": 131,
          "na": 131,
          "p_missing": 0.29,
          "p_uniques": 27.38,
          "quantile": {
            "0.05": 1.1,
            "0.25": 7.2,
            "0.5": 32.6,
            "0.75": 202.6,
            "0.95": 4000.0
          },
          "range": 60000000.0,
          "skewness": 76.90758652549457,
          "stddev": 574988.8764104772,
          "sum": 605281210.6370419,
          "uniques_count": 12515,
          "variance": 330612207995.783,
          "zeros": 19
        }
      },
      "name": {
        "column_type": "categorical",
        "frequency": [{
            "count": 1,
            "percentage": 0.00219,
            "value": "Diep River"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Kulp"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Tambakwatu"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Wuzhi"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Acfer 216"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Acfer 290"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Allan Hills 83017"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Allan Hills 84050"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Allan Hills 84065"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "Allan Hills 84134"
          }
        ],
        "name": "name",
        "stats": {
          "missing_count": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "uniques_count": 0
        }
      },
      "nametype": {
        "column_type": "categorical",
        "frequency": [{
            "count": 45641,
            "percentage": 99.83594,
            "value": "Valid"
          },
          {
            "count": 75,
            "percentage": 0.16406,
            "value": "Relict"
          }
        ],
        "name": "nametype",
        "stats": {
          "missing_count": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "uniques_count": 0
        }
      },
      "recclass": {
        "column_type": "categorical",
        "frequency": [{
            "count": 416,
            "percentage": 0.90997,
            "value": "CM2"
          },
          {
            "count": 240,
            "percentage": 0.52498,
            "value": "Howardite"
          },
          {
            "count": 8,
            "percentage": 0.0175,
            "value": "OC3"
          },
          {
            "count": 3,
            "percentage": 0.00656,
            "value": "Enst achon-ung"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "H5-an"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "H3.7-5"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "C6"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "K"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "CK3.8"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "EL6 "
          }
        ],
        "name": "recclass",
        "stats": {
          "missing_count": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "uniques_count": 0
        }
      },
      "reclat": {
        "column_type": "numeric",
        "dtypes_stats": {
          "bool": 0,
          "date": 0,
          "float": 38401,
          "int": 0,
          "missing": 0,
          "null": 7315,
          "string": 0
        },
        "frequency": [{
            "count": 2,
            "percentage": 0.00437,
            "value": "52.550000"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "50.200000"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "53.350000"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "-30.133330"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "-76.830270"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "-76.705920"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "-76.721460"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "36.266670"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "34.346670"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "35.047530"
          }
        ],
        "hist": [{
            "lower": -87.36666870117188,
            "upper": -78.9400016784668,
            "value": 0
          },
          {
            "lower": -78.9400016784668,
            "upper": -70.51333465576172,
            "value": 8304
          },
          {
            "lower": -70.51333465576172,
            "upper": -62.08666763305665,
            "value": 13790
          },
          {
            "lower": -62.08666763305665,
            "upper": -53.660000610351574,
            "value": 1
          },
          {
            "lower": -53.660000610351574,
            "upper": -45.2333335876465,
            "value": 1
          },
          {
            "lower": -45.2333335876465,
            "upper": -36.80666656494142,
            "value": 3
          },
          {
            "lower": -36.80666656494142,
            "upper": -28.379999542236344,
            "value": 38
          },
          {
            "lower": -28.379999542236344,
            "upper": -19.953332519531266,
            "value": 641
          },
          {
            "lower": -19.953332519531266,
            "upper": -11.526665496826187,
            "value": 529
          },
          {
            "lower": -11.526665496826187,
            "upper": -3.099998474121108,
            "value": 53
          },
          {
            "lower": -3.099998474121108,
            "upper": 5.326668548583971,
            "value": 43
          },
          {
            "lower": 5.326668548583971,
            "upper": 13.75333557128905,
            "value": 6463
          },
          {
            "lower": 13.75333557128905,
            "upper": 22.18000259399413,
            "value": 74
          },
          {
            "lower": 22.18000259399413,
            "upper": 30.606669616699207,
            "value": 3237
          },
          {
            "lower": 30.606669616699207,
            "upper": 39.03333663940428,
            "value": 2554
          },
          {
            "lower": 39.03333663940428,
            "upper": 47.46000366210936,
            "value": 1508
          },
          {
            "lower": 47.46000366210936,
            "upper": 55.88667068481443,
            "value": 633
          },
          {
            "lower": 55.88667068481443,
            "upper": 64.31333770751951,
            "value": 351
          },
          {
            "lower": 64.31333770751951,
            "upper": 72.74000473022458,
            "value": 149
          },
          {
            "lower": 72.74000473022458,
            "upper": 81.16667175292966,
            "value": 21
          }
        ],
        "name": "reclat",
        "stats": {
          "coef_variation": -1.18547,
          "interquartile_range": 76.71424,
          "kurtosis": -1.4768000616006505,
          "mad": 12.76421,
          "max": 81.16667175292969,
          "mean": -39.12258010110455,
          "median": -71.5,
          "min": -87.36666870117188,
          "missing_count": 7315,
          "na": 7315,
          "p_missing": 16.0,
          "p_uniques": 28.17,
          "quantile": {
            "0.05": -84.35516,
            "0.25": -76.71424,
            "0.5": -71.5,
            "0.75": 0.0,
            "0.95": 34.49058
          },
          "range": 168.53334045410156,
          "skewness": 0.4915911839652446,
          "stddev": 46.37851116080687,
          "sum": -1502346.198462516,
          "uniques_count": 12876,
          "variance": 2150.966297493088,
          "zeros": 6438
        }
      },
      "reclong": {
        "column_type": "numeric",
        "dtypes_stats": {
          "bool": 0,
          "date": 0,
          "float": 38401,
          "int": 0,
          "missing": 0,
          "null": 7315,
          "string": 0
        },
        "frequency": [{
            "count": 2,
            "percentage": 0.00437,
            "value": "-64.550000"
          },
          {
            "count": 2,
            "percentage": 0.00437,
            "value": "-5.866670"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "-100.866670"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "-99.383330"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "150.516670"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "3.860830"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "157.071740"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "156.964540"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "156.923220"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "156.434180"
          }
        ],
        "hist": [{
            "lower": -165.43333435058594,
            "upper": -139.4380012512207,
            "value": 0
          },
          {
            "lower": -139.4380012512207,
            "upper": -113.44266815185546,
            "value": 258
          },
          {
            "lower": -113.44266815185546,
            "upper": -87.44733505249022,
            "value": 450
          },
          {
            "lower": -87.44733505249022,
            "upper": -61.452001953124984,
            "value": 1257
          },
          {
            "lower": -61.452001953124984,
            "upper": -35.45666885375975,
            "value": 1600
          },
          {
            "lower": -35.45666885375975,
            "upper": -9.461335754394518,
            "value": 90
          },
          {
            "lower": -9.461335754394518,
            "upper": 16.533997344970714,
            "value": 78
          },
          {
            "lower": 16.533997344970714,
            "upper": 42.52933044433595,
            "value": 8903
          },
          {
            "lower": 42.52933044433595,
            "upper": 68.52466354370118,
            "value": 7026
          },
          {
            "lower": 68.52466354370118,
            "upper": 94.5199966430664,
            "value": 3238
          },
          {
            "lower": 94.5199966430664,
            "upper": 120.51532974243165,
            "value": 2694
          },
          {
            "lower": 120.51532974243165,
            "upper": 146.5106628417969,
            "value": 176
          },
          {
            "lower": 146.5106628417969,
            "upper": 172.50599594116213,
            "value": 661
          },
          {
            "lower": 172.50599594116213,
            "upper": 198.50132904052737,
            "value": 11776
          },
          {
            "lower": 198.50132904052737,
            "upper": 224.4966621398926,
            "value": 193
          }
        ],
        "name": "reclong",
        "stats": {
          "coef_variation": 1.32048,
          "interquartile_range": 157.16667,
          "kurtosis": -0.7312421309648038,
          "mad": 39.53972,
          "max": 354.47332763671875,
          "mean": 61.07431878848027,
          "median": 35.66667,
          "min": -165.43333435058594,
          "missing_count": 7315,
          "na": 7315,
          "p_missing": 16.0,
          "p_uniques": 32.17,
          "quantile": {
            "0.05": -90.36556,
            "0.25": 0.0,
            "0.5": 35.66667,
            "0.75": 157.16667,
            "0.95": 168.0
          },
          "range": 519.9066619873047,
          "skewness": -0.17448956065997298,
          "stddev": 80.64729806550085,
          "sum": 2345314.915796431,
          "uniques_count": 14709,
          "variance": 6503.986685265737,
          "zeros": 6214
        }
      },
      "year": {
        "column_type": "date",
        "frequency": [{
            "count": 45,
            "percentage": 0.09843,
            "value": "01/01/1938 12:00:00 AM"
          },
          {
            "count": 18,
            "percentage": 0.03937,
            "value": "01/01/1924 12:00:00 AM"
          },
          {
            "count": 14,
            "percentage": 0.03062,
            "value": "01/01/1899 12:00:00 AM"
          },
          {
            "count": 12,
            "percentage": 0.02625,
            "value": "01/01/1866 12:00:00 AM"
          },
          {
            "count": 12,
            "percentage": 0.02625,
            "value": "01/01/1893 12:00:00 AM"
          },
          {
            "count": 8,
            "percentage": 0.0175,
            "value": "01/01/1822 12:00:00 AM"
          },
          {
            "count": 5,
            "percentage": 0.01094,
            "value": "01/01/1859 12:00:00 AM"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "01/01/1817 12:00:00 AM"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "01/01/1636 12:00:00 AM"
          },
          {
            "count": 1,
            "percentage": 0.00219,
            "value": "01/08/0601 12:00:00 AM"
          }
        ],
        "name": "year",
        "stats": {
          "kurtosis": null,
          "max": null,
          "mean": null,
          "min": null,
          "missing_count": 45716,
          "na": 45716,
          "p_missing": 100.0,
          "p_uniques": 0.0,
          "skewness": null,
          "stddev": null,
          "sum": null,
          "uniques_count": 0,
          "variance": null,
          "zeros": 0
        }
      }
    },
    "count_types": {
      "categorical": 5,
      "date": 1,
      "null": 0,
      "numeric": 4
    },
    "rows_count": 45716,
    "size": "47.3MiB",
    "summary": {
      "cols_count": 10,
      "missing_count": "0.4891941552191793%",
      "rows_count": 45716,
      "size": "36.5MiB"
    }
  };

  // let dataset = {
  //   "columns": {
  //     "escuelas_cercanas": {
  //       "column_type": "bool",
  //       "dtypes_stats": {
  //         "bool": 21,
  //         "date": 0,
  //         "float": 0,
  //         "int": 0,
  //         "missing": 0,
  //         "null": 76,
  //         "string": 3
  //       },
  //       "frequency": [
  //         {
  //           "count": 76,
  //           "percentage": 76.0,
  //           "value": null
  //         },
  //         {
  //           "count": 21,
  //           "percentage": 21.0,
  //           "value": "true"
  //         },
  //         {
  //           "count": 3,
  //           "percentage": 3.0,
  //           "value": "si"
  //         }
  //       ],
  //       "name": "escuelas_cercanas",
  //       "stats": {
  //         "missing_count": 76,
  //         "p_missing": 76.0,
  //         "p_uniques": 3.0,
  //         "uniques_count": 3
  //       }
  //     },
  //     "preciorenta": {
  //       "column_type": "numeric",
  //       "dtypes_stats": {
  //         "bool": 0,
  //         "date": 0,
  //         "float": 100,
  //         "int": 0,
  //         "missing": 0,
  //         "null": 0,
  //         "string": 0
  //       },
  //       "frequency": [
  //         {
  //           "count": 98,
  //           "percentage": 98.0,
  //           "value": null
  //         },
  //         {
  //           "count": 1,
  //           "percentage": 1.0,
  //           "value": 810
  //         },
  //         {
  //           "count": 1,
  //           "percentage": 1.0,
  //           "value": 300
  //         }
  //       ],
  //       "hist": [
  //         {
  //           "bin": null,
  //           "count": 2,
  //           "max": 100,
  //           "min": 0
  //         },
  //         {
  //           "bin": 1.0,
  //           "count": 1,
  //           "max": 200,
  //           "min": 100
  //         },
  //         {
  //           "bin": 2.0,
  //           "count": 4,
  //           "max": 300,
  //           "min": 200
  //         }
  //       ],
  //       "name": "preciorenta",
  //       "stats": {
  //         "coef_variation": 0.64977,
  //         "interquartile_range": 510.0,
  //         "kurt": -2.0,
  //         "mad": 0.0,
  //         "max": 810,
  //         "mean": 555.0,
  //         "median": 300.0,
  //         "min": 300,
  //         "missing_count": 98,
  //         "p_missing": 98.0,
  //         "p_uniques": 3.0,
  //         "p_zeros": 0.0,
  //         "quantile": {
  //           "0.05": 300.0,
  //           "0.25": 300.0,
  //           "0.5": 300.0,
  //           "0.75": 810.0,
  //           "0.95": 810.0
  //         },
  //         "range": 510,
  //         "skewness": 0.0,
  //         "stdev": 360.62446,
  //         "sum": 1110,
  //         "uniques_count": 3,
  //         "variance": 130050.0,
  //         "zeros": 0
  //       }
  //     }
  //   },
  //   "count_types": {
  //     "bool": 1,
  //     "categorical": 0,
  //     "date": 0,
  //     "null": 0,
  //     "numeric": 1
  //   },
  //   "rows_count": 100,
  //   "size": "18.5MiB",
  //   "summary": {
  //     "cols_count": 89,
  //     "missing_count": "66.51%",
  //     "rows_count": 100,
  //     "size": "17.6MiB"
  //   }
  // };

    store.commit('add', dataset);

    // console.log('params.id = ', params.id);

    // return axios.get(`https://itunes.apple.com/search?term=${params.id}&entity=album`)
    //     .then((response) => {
    //         store.commit('add', response.data.results);
    //     });


}