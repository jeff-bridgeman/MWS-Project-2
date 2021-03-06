let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {

});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}
/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
 window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  DBHelper.nextPending();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  const imgur = DBHelper.imageUrlForRestaurant(restaurant);
  image.className = 'restaurant-img';
  image.alt = 'Image of ' + restaurant.name + ' restaurant.';
  image.src = imgur + '.webp';
  li.append(image);

//Create restaurant information box
  const div = document.createElement('div');
  div.className = 'restaurant-information';
  li.append(div);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  div.append(name);

  console.log(`${restaurant.name} is favorite: ${restaurant['is_favorite']}`);
  const isFavorite = (restaurant['is_favorite'] && restaurant['is_favorite'].toString() === 'true')
  ? true
  : false;
  const favoriteDiv = document.createElement('div');
  favoriteDiv.className = 'favorite-icon';
  const favorite = document.createElement('button');
  favorite.style.background = isFavorite
    ? `url('/icons/heart-solid.svg') no-repeat`
    : `url('icons/heart-regular.svg') no-repeat`;
  favorite.innerHTML = isFavorite
  ? '  ' + restaurant.name + ' is a favorite'
  : '  ' + restaurant.name + ' is not a favorite';
  favorite.id = 'favorite-icon-' + restaurant.id;
  favorite.onclick = event => handleFavoriteClick(restaurant.id, !isFavorite);
  favoriteDiv.append(favorite);
  div.append(favoriteDiv);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div.append(address);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label',restaurant.name);
  more.onclick = () => {
    const url = DBHelper.urlForRestaurant(restaurant);
    window.location = url;
  }
  //more.id = restaurant.name;
  div.append(more)

  return li
}

const handleFavoriteClick = (id, newState) => {
  const favorite = document.getElementById('favorite-icon-' + id);
  const restaurant = self
    .restaurants
    .filter(r => r.id === id)[0];
  if (!restaurant)
    return;
  restaurant['is_favorite'] = newState;
  favorite.onclick = event => handleFavoriteClick(restaurant.id, !restaurant['is_favorite']);
  DBHelper.handleFavoriteClick(id, newState);
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
