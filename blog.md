# Blog Post - FastGo with TripGo API

## Motivation

I sometimes find myself trying to find a place, any place providing a specific service or product, and I want to find the one I can get faster to it, no matter which one it is. For example, I need to get some cash, so, I need to get to an ATM, no matter which one, just any. The same happens to any other kind of places, like Petrol Stations, a grocery stores, or even McDonalds.    

TripGo API allows us to compute routes from A to B, given a single mode of transport, or even multiple modes. So, we are going to build a sample app, lets call it 'FastGo', to compute the faster way to a specific kind of place. We will need the current location of the user, preferred mean of transport (for simplicity) and a set of possible places for each available kind. 

## Goal

The main goal is to show one way of using TripGo API platform, and having an example app will help us motivate and describe the usage of different services available in the platform. Given that our platform has free tier and you can sign up to get an API key, we share the complete example app in GitHub so you can play with it yourself.

For simplicity, we are going to restrict our app to [a single city], but it can easily be extended to cover all the cities covered in our platform. We will be then use regions endpoint to get the server urls we need to use to compute our routes, we will use routing endpoint to compute the actual trips, locations endpoint to show relevant POIs in the map near the user, and services endpoint to show realtime information of a specific transit service.


## Let's begin

As mentioned earlier, we first need to know to which server we can send our requests to. This is because TripGo API platform is composed by a few servers around the globe, but not every server has every region. Also, if there’s an error connecting to one server, we can switch to the next available one. Note that this is the only time were we need a specific base url (https://tripgo.skedgo.com/satapp), all the remaining base urls will be obtained from this first request.

So, hitting `https://tripgo.skedgo.com/satapp/regions.json` will return the list of available regions and modes, we can search the JSON response for [city] and get the list of urls, which will become our set of base urls to try for the following requests. We can cache this response, but we still need to refresh it regularly, as those URLs may change without notice.


[sample request/response pair]

Notes on request/response details.

Having the base urls for our city is the first step, we need to get from the user, its current location, the selection of one or more of the available modes and a set of places of a given kind (we will assume a fixed list of places, since this is out of our scope). Once we have all these, we are ready to move to the core of our application... routing. 


## Routing

We need to find which of the possible places is the faster for the user to get there. We will use routing.json endpoint to compute trips from the user current location to all the possible places, using the selected mode or modes of transport. In order to do so, we need to send in every request, the from location (current location) with each possible place as to location, including the selected mode.  

[sample request/response pair]

Note that the responses are optimized to reduce its size, trying to eliminate any duplicated data. So, you will find a field in the response called `segmentTemplates`, which will include information of segments that is shared among several trips in that response. You will also get the trips grouped in a field called `groups`, each group takes the same modes, and similar stops and tickets. Each trip will have a `depart` and `arrive` field, and also the segments that form the trip among other useful values.

For each group of trips, we will select a representative one, which will be the one having the lower arrive time and the lower depart time greater than now. Then we will sort all the representative trips by arrive time. The one that we want to show to the user is the first one, but we may also show other alternatives.

[screenshot?]

### Extracting trip detailed information

<how to construct the trip using templates>

<information about segments with encoded waypoints>


### Advanced parameters and values

As part of each routing request the user can tweaks some parameters that the routing algorithm can consider at the moment of computing the best trip for the given A-to-B pairs and transport modes. For example, it is possible to change the preferred transfer time, which may extend or reduce the time the trip can use when switching between public trasnport. It is also possible to set the walking and cycling speed, to improve the accuracy of the computed results. There are also flags to enable some specific features, like `wheelchair` flag that will try to compute a wheelchair friendly trip, including specific information when available; or `conc` that will use concession pricing when possible for computing public transport costs.

Another possible parameter is what we call the `weighting preferences`, which is a set of four values, allowing the user to change the weights among price, environment impact, duration and convenience. The values range from 0.1 to 2 for each of them, meaning unimportant to very important, and the overal sum should not exceed `4`. For example, a `weighing preference` equals to (1.9, 1.9, 0.1, 0.1) means that the user cares the most in the price and environmental impact of the trip, and almost nothing in the duration and convenience of the trip.

Considering the values obtained in the response, each trip will include different costs, like calories (to burn), carbon (CO2 to use), hassle (inconviniece) and money (a null value doesn't mean it's free, but that we don't know its cost). The response will also include some urls to save the trip or update it for realtime changes.


[we can wrap the post here, or even before, cutting down the advanced subsection, or continue with other sections like the following ones. I think it would be great to add more endpoints, since currently we only used two, but it may also make the post too long (we can split it in two then?)]


## POIs

Besides showing the trip details in the map, we can also show some POIs for the selected mode of transport, like shared bike pods if it is bike, or stops if it public transport.


## Services

In the case of public transport, we may use the service.json endpoint to obtain real time information for a transit service, and know, if available, whether the bus the user needs to catch is closer or not.

