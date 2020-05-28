// Получаем данные со страницы

const formSearch = document.querySelector('.form-search'),
  inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
  dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
  inputCitiesTo = formSearch.querySelector('.input__cities-to'),
  dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
  inputDateDepart = formSearch.querySelector('.input__date-depart'),
  cheapestTicket = document.getElementById('cheapest-ticket'),
  otherCheapTickets = document.getElementById('other-cheap-tickets');

// Данные 

const CITIES_API = '../data/cities.json', // http://api.travelpayouts.com/data/ru/cities.json
  PROXY = 'https://cors-anywhere.herokuapp.com/',
  API_KEY = '96dbc5b51059777b7634aa23a0ce0f81',
  CALENDAR = 'http://min-prices.aviasales.ru/calendar_preload',
  MAX_COUNT = 10;


// Функции
let city = [];

const getData = (url, callback, reject = console.error) => {
  const request = new XMLHttpRequest();

  request.open('GET', url);

  request.addEventListener('readystatechange', () => {
    if (request.readyState !== 4) return;

    if (request.status === 200) {
      callback(request.response);
    } else {
      reject(request.status);
    }

  });

  request.send();
};




const showSity = (input, list) => {
  list.textContent = '';

  if (input.value !== '') {
    const filterCity = city.filter((item) => {
      const fixItem = item.name.toLowerCase();
      return fixItem.startsWith(input.value.toLowerCase());
    });

    filterCity.forEach((item) => {
      const li = document.createElement('li');
      li.classList.add('dropdown__city');
      li.textContent = item.name;
      list.append(li);
    });

  }
};



const handlerCity = (event, input, list) => {
  const target = event.target;
  if (target.tagName.toLowerCase() === 'li') {
    input.value = target.textContent;
    list.textContent = '';
  }
};

const getNameCity = (code) => {
  const objCity = city.find((item) => item.code === code);
  return objCity.name;
};

const getDate = (date) => {
  return new Date(date).toLocaleString('ru', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
};

const getChanges = (num) => {
  if (num) {
    return num === 1 ? 'Разочек пересядешь' : 'Побегаешь по терминалу';
  } else {
    return 'Пересадки отсутствуют, уважаемый';
  }
};

const getLinkAviasales = (data) => {

  let link = 'https://www.aviasales.ru/search/';

  link += data.origin;

  const date = new Date(data.depart_date);

  const day = date.getDate();

  link += day < 10 ? '0' + day : day;

  const month = date.getMonth() + 1;

  link += month < 10 ? '0' + month : month;

  link += data.destination;

  link += '1';

  return link;


};

const createCard = (data) => {
  const ticket = document.createElement('article');
  ticket.classList.add('ticket');

  let deep = '';

  if (data) {
    deep = `
    <h3 class="agent">${data.gate}</h3>
    <div class="ticket__wrapper">
      <div class="left-side">
        <a href="${getLinkAviasales(data)}" target="_blank" class="button button__buy">Купить
          за ${data.value}₽</a>
      </div>
      <div class="right-side">
        <div class="block-left">
          <div class="city__from">Летим из:
            <span class="city__name">${getNameCity(data.origin)}</span>
          </div>
          <div class="date">${getDate(data.depart_date)}</div>
        </div>
    
        <div class="block-right">
          <div class="changes">${getChanges(data.number_of_changes)}</div>
          <div class="city__to">Прилетим в:
            <span class="city__name">${getNameCity(data.destination)}</span>
          </div>
        </div>
      </div>
    </div>
    `;
  } else {
    deep = '<h3>Не судьба уважаемый, давай в другой раз. Смотри другие даты</h3>'
  }



  ticket.insertAdjacentHTML('afterbegin', deep);

  return ticket;
};


const renderCheapDay = (cheapTicket) => {
  cheapestTicket.style.display = 'block';
  cheapestTicket.innerHTML = '<h2>Бюджетно укатить сегодня получится</h2>';

  const ticket = createCard(cheapTicket[0]);
  cheapestTicket.append(ticket);
};


const renderCheapYear = (cheapTiсkets) => {
  otherCheapTickets.style.display = 'block';
  otherCheapTickets.innerHTML = '<h2>Можно конечно и в другой день</h2>';

  cheapTiсkets.sort((a, b) => a.value - b.value);

  for (let i = 0; i < cheapTiсkets.length && i < MAX_COUNT; i++) {

    const ticket = createCard(cheapTiсkets[i]);
    otherCheapTickets.append(ticket);
  }

};

const renderCheap = (data, date) => {
  const cheapTicketYear = JSON.parse(data).best_prices;



  const cheapTicketDay = cheapTicketYear.filter((item) => {
    return item.depart_date === date;
  })


  renderCheapDay(cheapTicketDay);
  renderCheapYear(cheapTicketYear);
};



//  Обработчики событий

inputCitiesFrom.addEventListener('input', () => {
  showSity(inputCitiesFrom, dropdownCitiesFrom)
});

inputCitiesTo.addEventListener('input', () => {
  showSity(inputCitiesTo, dropdownCitiesTo)
});

dropdownCitiesFrom.addEventListener('click', (event) => {
  handlerCity(event, inputCitiesFrom, dropdownCitiesFrom);
});

dropdownCitiesTo.addEventListener('click', (event) => {
  handlerCity(event, inputCitiesTo, dropdownCitiesTo);
});


formSearch.addEventListener('submit', (event) => {
  event.preventDefault();

  const cityFrom = city.find((item) => {
    return inputCitiesFrom.value === item.name
  });

  const cityTo = city.find((item) => {
    return inputCitiesTo.value === item.name
  });

  const formData = {
    from: cityFrom,
    to: cityTo,
    when: inputDateDepart.value,
  };

  if (formData.from && formData.to) {

    const requestData = `?depart_date=${formData.when}&origin=${formData.from.code}&destination=${formData.to.code}&one_way=true&token=${API_KEY}`;

    getData(CALENDAR + requestData, (response) => {
      renderCheap(response, formData.when);
    }, error => {
      alert('Куда собрался приятель?');
      console.error('Ошибочка: ', error);
    });

  } else {
    alert('Введи нормально!');
  }

});

// Вызовы функций

getData(CITIES_API, (data) => {
  city = JSON.parse(data).filter(item => item.name);

  city.sort((a, b) => {
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }

    return 0;
  });

});