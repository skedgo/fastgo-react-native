# Blog Post - [FastGo](https://appetize.io/app/tc2uejy91rb594qmw1zmm1kn48?device=iphone6s&scale=75&orientation=portrait&osVersion=9.3) with TripGo API

## Motivation

The TripGo API can be used in several different ways: for example, it’s possible to create trips that are most cost efficient, show the quickest route or the most environmentally friendly. It also allows us to compute alternative routes from A to B, given a single mode of transport or multiple modes, and it allows planning an itinerary for a whole day.

In this blog post I will demonstrate the ability to get the fastest trip from A to B. Say, you’d like to get from your current location to the next ATM, petrol station or McDonalds by the fastest way possible. 

Let’s build a sample app and call it '*FastGo*', to compute the quickest way to a specific place. We need the current location of the user, preferred means of transport (for simplicity we will only allow one) and a set of possible places.


## Goal

The main goal is to show one way of using the [TripGo API](https://skedgo.com/en/tripgo-api/). Having an example app will help us motivate and describe the usage of different services available in the platform. Since our platform has a free tier, we built the complete example app using [react-native](https://facebook.github.io/react-native/) and share it in [GitHub](https://github.com/skedgo/fastgo-react-native) so you can sign up to get an API key and play with it yourself.

We are going to restrict our app to a single city, but it can easily be extended to cover any city which the TripGo API [covers](https://tripgo.com/world). The platform provides several endpoints, of which a small subset will be shown and explained in this post. In general, the endpoints are called in a specific sequence, all starting from the `regions.json` endpoint, to get information about the available regions and then either go, for example, with the routing group or the location/services group, as shown in the following diagram:

![Endpoints Diagram][diagram]

[diagram]: FastGoEndpointsSimpleDiagram.png "Endpoints Diagram"

In this post, we will focus on the routing group. We will use the `regions` endpoint to get the server URLs and the available modes we need to use to compute our routes, the `routing` endpoint to compute the actual trips, and then, use the `trip update` URL to get real-time updates of our recently computed trip.

## Let's begin

As mentioned earlier, we first need to know to which server we can send our requests. This is because the TripGo API platform is composed by several servers around the globe, but not every server has every region. Also, if there’s an error connecting to one server, we can switch to the next available one. Note that this is the only time were we need a specific base url (https://tripgo.skedgo.com/satapp), all the remaining base URLs will be obtained from this first request.

So, hitting `https://tripgo.skedgo.com/satapp/regions.json` will return the list of available regions and modes. We can search the JSON response for [city] and get the list of URLs, which will become our set of base URLs to use for the following requests. We can cache this response, but still need to refresh it regularly, as those URLs may change without notice, and new regions or modes might get added.

### Request 

```js
  getRegions() {
    return fetch(env.BASE_API_URL + 'regions.json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-TripGo-Key': env.TRIPGO_API_KEY 
      },
      body: JSON.stringify({
        v: '2',
      })
    })
    .then((response) => response.json());
  }
```

Note that we do a `POST` including the `X-TripGo-Key` in the header, and we send as the body a JSON object indicating that we want the response in the second version of the `regions.json` endpoint.

### Response 

```json
{
  "hashCode": 1993408060,
  "modes": {
    "cy_bic-s_citybikes-helsinki": {
      "URL": "https://www.hsl.fi/en/citybikes",
      "color": {
        "blue": 52,
        "green": 188,
        "red": 251
      },
      "title": "City bikes"
    },
    "<modes>" : {"...": "..."}
  },
  "regions": [
    {
      "cities": [
        {
          "lat": -33.86749,
          "lng": 151.20699,
          "timezone": "Australia/Sydney",
          "title": "Sydney, NSW, Australia"
        }, 
        {
          "...": "..."
        }
      ],
      "modes": ["<string>", "..."],
      "name": "AU_NSW_Sydney",
      "polygon": "nwcvE_fno[owyR??mcjRnwyR?",
      "timezone": "Australia/Sydney",
      "urls": ["<string>", "..."]
    },
    {
      "...": "..."
    }
  ]
}
```

The response is a JSON object with a hash code value, the list of available modes with their data and the list of regions. The hash code can be used in future requests to inform that we already have a cached version and that we only want the response if anything has changed, such as new regions or transport providers having been added. Each region will have the list of main cities in it, the list of modes (just the keys of the values in the global modes list), a name, the polygon that is covered by that region, a default time zone and the list of base URLs we can use for sending further requests.

Having the base URLs for our city is the first step, then, we need to get the user's current location, the selected mode from the available ones and a set of places of a given kind (we will assume a fixed list of places, since this is out of our scope). Once we have all these, we are ready to move to the core of our application: Routing. 


## Routing

We need to find which of the possible places is the fastest for the user. We will use `routing.json` endpoint to compute trips from the user's current location to all possible places, using the selected mode of transport. In order to do so, we need to send in every request, the `from` location (current location) with each possible place as `to` location, and the selected mode. Therefore, we would call the following method multiple times, with the different `to` locations.

### Request 

```js
computeTrip(baseUrl, selectedMode, fromLoc, toLoc) {
  data = {
    fromLoc: `(${fromLoc.latitude},${fromLoc.longitude})`,
    toLoc: `(${toLoc.latitude},${toLoc.longitude})`,
    mode: selectedMode,
    wp: '(1,1,1,1)',
    v: 11,
    includeStops: true
  }
  let url = baseUrl + '/routing.json'+ 
  `?from=${data.fromLoc}&to=${data.toLoc}&modes=${data.mode}&wp=${data.wp}&v=${data.v}&includeStops=${data.includeStops}`
  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-TripGo-Key': env.TRIPGO_API_KEY 
    }
  })
  .then((response) => response.json())
}
```

In this case we do a GET request, also including the `X-TripGo-Key` in the header, and passing the parameters in the URL, like the from and to locations, the mode selected by the user, the weighting preferences (will be explained in [Advanced](#advanced-parameters-and-values) section) and the expected version of the result. In this case, we do not send any information about depart or arrival times, meaning that we want trips departing *now*. This is related to the use we need in this example, but it is important to note that you can ask for trips departing at a given time from the origin, or arriving at a given time to the destination.

### Response 

```json
{
  "realTimeStamp": 0,
  "region": "AU_NSW_Sydney",
  "regions": [
    "AU_NSW_Sydney"
  ],
  "groups": [
    {
      "sources": [
        "..."
      ],
      "trips": [
        {
          "arrive": 1495154251,
          "availability": "AVAILABLE",
          "caloriesCost": 30,
          "carbonCost": 3,
          "currencySymbol": "AUD",
          "depart": 1495152642,
          "hassleCost": 10,
          "mainSegmentHashCode": -1301095336,
          "moneyCost": 4.15,
          "moneyUSDCost": 3.25,
          "plannedURL": "<baseURL>/trip/planned/dd7ada5e-ddbd-4def-927c-880b2d60e57f",
          "progressURL": "<baseURL>/trip/progress/dd7ada5e-ddbd-4def-927c-880b2d60e57f",
          "queryIsLeaveAfter": true,
          "queryTime": 1495152642,
          "saveURL": "<baseURL>/trip/save/dd7ada5e-ddbd-4def-927c-880b2d60e57f",
          "segments": [
            {
              "availability": "AVAILABLE",
              "endTime": 1495154082,
              "realTime": true,
              "segmentTemplateHashCode": -1301095336,
              "startTime": 1495152642
            }
          ],
          "temporaryURL": "<baseURL>/trip/dd7ada5e-ddbd-4def-927c-880b2d60e57f",
          "updateURL": "<baseURL>/trip/update/dd7ada5e-ddbd-4def-927c-880b2d60e57f?hash=-1553495163",
          "weightedScore": 26.3
        },
        {"...": "..."}
      ]
    }
  ],
  "segmentTemplates": [
    {
      "action": "Drive Car<DURATION>",
      "durationWithoutTraffic": 1255,
      "from": {
        "address": "George Street & Albion Place",
        "class": "Location",
        "lat": -33.87553,
        "lng": 151.2066,
        "timezone": "Australia/Sydney"
      },
      "hashCode": -1301095336,
      "metres": 6899,
      "mini": {
        "description": "Princes Highway & Albert Street",
        "instruction": "Drive Car",
        "mainValue": "7.0km"
      },
      "modeIdentifier": "me_car",
      "modeInfo": {
        "alt": "Car",
        "identifier": "me_car",
        "localIcon": "car"
      },
      "notes": "Live traffic: from 16 mins to 26 mins\n7.0km",
      "streets": [
        {
          "encodedWaypoints": "<string>"
        }
      ],
      "to": {
        "address": "Princes Highway & Albert Street",
        "class": "Location",
        "lat": -33.91288,
        "lng": 151.17905,
        "timezone": "Australia/Sydney"
      },
      "travelDirection": 323,
      "type": "unscheduled",
      "visibility": "in summary"
    },
    {"...": "..."}
  ]
}
```

Note that the responses are optimized to reduce their size, trying to eliminate any duplicated data. So, you will find a field in the response called `segmentTemplates`, which will include information of segments shared among several trips in that response. You will also get the trips grouped in a field called `groups`, each group takes the same modes, and similar stops and tickets. Each trip will have a `depart` and `arrive` field, and also the segments that form the trip among other useful values.

For each group of trips, we will select a representative one, which will be the one having the lower *score* (the field named `weightedScore`) . Then we will sort all the representative trips by arrive time. The one that we want to show to the user is the first one, but we may also show other alternatives.

![Screenshot][screenshot]

[screenshot]: screenshot.png "Showing fastest route"


### Extracting detailed trip information

In order to be able to display the trip to the user, we will show how to construct a trip from a `routing.json` response with all the required information. We are going to do so to explain the format of the response further, and also for sake of simplicity of our example. First, we will iterate over all the trips to find the selected one, identified by its `updateURL`, since we know it will be unique for all the trips and it will also be needed later on to update the trip with real-time information. Once we have it, we will iterate over all the segments, and use the segment template hash code to find the corresponding segment template in the list of shared templates and copy all the field-value pairs to our trip segment.


```javascript
buildSelectedTrip(routingJSON, seletedTripUpdateURL) {
  let result = null;
  let segmentTemplates = routingJSON.segmentTemplates;
  util.forEachTrip(routingJSON, (trip => {
    if (trip.updateURL !== seletedTripUpdateURL)
      return;
    trip.segments.map(segment => {
      segmentTemplate = this.getSegmentTemplate(segmentTemplates, segment.segmentTemplateHashCode);
      for (var key in segmentTemplate)
        segment[key] = segmentTemplate[key];
    })
    result = trip;
  }));
  return result;
}
```

Note that `forEachTrip` and `getSegmentTemplate` are helper methods we defined. You can look at them in the shared code. Now that we have a trip with all the information, we want to show it in the map. The trip will have a list of `segments`, which correspond to the different parts of the trip. Each segment will be of one transport mode (walking, cycling, bus, train, etc.) and will contain all the relevant information of that part of the trip, including the detailed waypoints to be shown in the map. 

<!-- [should we explain more about this?] -->


### Advanced parameters and values

As part of each routing request the user can tweak some parameters that the routing algorithm will consider at the moment of computing the best trip for the given A-to-B pairs and transport modes. For example, it is possible to change the preferred transfer time, which may extend or reduce the time the trip can use when switching between public transport. It is also possible to set the walking and cycling speed, to improve the accuracy of the computed results. There are also flags to enable some specific features, like the `wheelchair` flag that will try to compute a wheelchair friendly trip, including specific information when available; or `conc` that will use concession pricing when possible for computing public transport costs.

Another possible parameter is what we call the *weighting preferences*, which is a set of four values, allowing the user to change the weights among price, environment impact, duration and convenience. The values range from 0.1 to 2 for each of them, meaning unimportant to very important, and the overal sum should not exceed `4`. For example, a `weighing preference` equals to (1.9, 1.9, 0.1, 0.1) means that the user cares most about the price and environmental impact of the trip, and almost nothing about the duration and convenience of the trip.

Considering the values obtained in the response, each trip will include different costs, like calories (to burn), carbon (CO2 to use), hassle (inconvenience) and money (a null value doesn't mean it's free, but that we don't know its cost). The response will also include some URLs to save the trip or update it for real-time changes, which then leads us to the next section, how to update our trip.


## Update Trip

The trips returned by our platform may get updated with realtime information for different reasons. The most common one is a change in the data about public services and vehicle locations. In order to get that updated information, the `updateURL` included in the trip needs to be used.

### Request 

```javascript
  updateTrip(updateUrl) {
    let url = updateUrl + '&v=11';
    return fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-TripGo-Key': env.TRIPGO_API_KEY
        }
      })
      .then((response) => {
        return response.json()
        .catch(err => {
          return {};
        });;
      })
  }
```

Note that we add an extra query param to the url coming from the trip to inform that we support version 11 of the response for trips. Also note that the `updateURL` will include a hash code that will allow the backend to return an empty response if nothing has changed since the latest update, so the app doesn't waste time parsing and redrawing the same trip it already has. The response will have the exact same format as the one returned by `routing.json` endpoint, but with always only one trip, the one is being updated.

## Wrapping up

We have built FastGo to demonstrate one way of using the most commonly used endpoints of our platform. We also pointed out some tips and tricks. Keep in mind that this is just a subset of all the endpoints available on our platform. For a detailed list of them, go to our [docs](https://skedgo.github.io/tripgo-api/site). Hope you enjoyed it! We would love to hear what you want to build with our API and how we can help you.

