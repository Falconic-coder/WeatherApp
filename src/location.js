const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

export async function getCoordinates(coordinates) {
  try {
    const position = await getCurrentPosition(); // wait to get the current position
    coordinates.push(position.coords.latitude);
    coordinates.push(position.coords.longitude);
    await getPlace(coordinates); // Get the place name based on the coordinates
    
  } catch (error) {
    const [lat, lon] = await IPlocation(); // Fallback to IP-based location if geolocation fails
    coordinates.push(lat);
    coordinates.push(lon);
    await getPlace(coordinates);
  }
}

async function IPlocation() {
  const response = await fetch("https://ipapi.co/json");
  const data = await response.json();
  return [data.latitude, data.longitude];
}

async function getPlace(coordinates, input){
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates[0]}&lon=${coordinates[1]}`);
    const data = await response.json();
    const valuesArr = Object.values(data.address);

    // get the place
    const b = valuesArr.slice(0, valuesArr.indexOf(data.address.state_district));
    const a = [...new Set(b)];

    // get the county/state_district and state name
    const c = valuesArr.slice(valuesArr.indexOf(data.address.state_district), valuesArr.indexOf(data.address.state)+1);
    const d = [...new Set(c)];
    
    coordinates.push(`${a}`);
    coordinates.push(`${d}`);
}
