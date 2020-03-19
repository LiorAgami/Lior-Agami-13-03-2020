
/**
 * Author : Lior Agami
 * This is "Weather Forecast App" - built with no frameworks as requested (except Jquery)
 * hope that you'll enjoy it - thanks :)
 */

function WeatherForecast(options){
	
	let self = this , opt = options || {}; 
	
	this.appCont = opt.appCont || 'app';
	this.hpName = opt.homePageName || 'home';
	this.fpName = opt.favPageName || 'favorites';
	this.hpBtnId = opt.homePageBtnId || '';
	this.fpBtnId = opt.favPageBtnId || '';
	this.srchInpId = opt.searchInputId || '';
	this.temprUnitCode = 1; /** 0 = fahrenheit , 1 = celsius **/
	this.themeMode = 1; /** 0 = light , 1 = dark **/
	this.favLocations = {};
	this.currLoctDtls = [];

	this.API_KEY = "8LI5Plq51ilw0XW3zlRrTuLsLPacsBST"; 
	// this.API_KEY = "oG502lNuWSXWo6iGrUrvZdbqULVIytzx"; // optional key

	this.GET_WEATHER_EP = 'https://dataservice.accuweather.com/currentconditions/v1/';
	this.GET_LOCATION_EP = 'https://dataservice.accuweather.com/locations/v1/cities/autocomplete';
	this.GET_5DAYFORECAST_EP = 'https://dataservice.accuweather.com/forecasts/v1/daily/5day/';
	this.GET_GEOPOSITION_EP = 'https://dataservice.accuweather.com/locations/v1/cities/geoposition/search';
	
	this.errDict = {
		'400':'Error - Parameters are in bad syntax or invalid',
		'401':'Error - API authorization failed',
		'403':'Error - No permission to access this endpoint.',
		'404':'Error - No permission to access this endpoint.',
		'500':'Error - Server has not found a route matching the given URI'
	};
	
	this.phrasesImgsObj = {
		'cloudy':'./assets/images/cloudy.svg',
		'cloud':'./assets/images/cloudy.svg',
		'clouds':'./assets/images/cloudy.svg',
		'night':'./assets/images/night.svg',
		'rain':'./assets/images/rain.svg',
		'raining':'./assets/images/rain.svg',
		'rainy':'./assets/images/rain.svg',
		'shower':'./assets/images/rain.svg',
		'showers':'./assets/images/rain.svg',
		'snowing':'./assets/images/snowing.svg',
		'snow':'./assets/images/snowing.svg',
		'storm':'./assets/images/storm.svg',
		'stormy':'./assets/images/storm.svg',
		'storming':'./assets/images/storm.svg',
		'sun':'./assets/images/sun.svg',
		'sunny':'./assets/images/sun.svg',
		'sunshine':'./assets/images/sun.svg'
	};

	this._buildAppLayout();

	/** build home page html with local geolocation data **/
	if ("geolocation" in navigator) {

		navigator.geolocation.getCurrentPosition(function(position) {

			let lat = (position && (position.coords ? position.coords.latitude : '') || ''),
			long = (position && (position.coords ? position.coords.longitude : '') || ''),
			url = self.GET_GEOPOSITION_EP+'?apikey='+self.API_KEY+'&q='+lat+','+long;
			
			self._makeHttpRequest({
				url: url,
				callback:function(locationObj){
					self._chooseLocation({
						target:{
							locationKey: locationObj.Key || '',
							innerText: locationObj.LocalizedName || ''
						}
					});	  					
				}
			});
		});	
		
	} else {
			
		/** geolocation ISN'T available - take tel aviv as default **/
		self._chooseLocation({
			target:{
				locationKey:'215854',
				innerText:'Tel Aviv'
			}
		});
	}
}

$.extend(WeatherForecast.prototype, {
	_buildAppLayout:function(){
		this._buildNavBar();
		this._buildHomePage();
		this._buildFavoritesPage();
	},
	_buildHomePage:function(){
		this._buildHomePageSearchCont();
	},
	_buildNavBar:function(){
		let self = this, $app , $body = $('body');

		let $appCont = $('<div>').attr('id',(self.appCont)).addClass('app'),
		$nav = $('<nav>').addClass('navbar navbar-light bg-light'),
		$navLink = $('<a>').attr('href','#').addClass('navbar-brand'),
		$rotatingIcoCont = $('<div>').addClass('rotatingIconCont d-flex justify-content-center align-items-center'),
		$rotatingIco = $('<i>').addClass('rotating rotatingIcon far fa-snowflake'),
		$navLinkTxt = $('<span>').text('Weather Forecast'),
		$routingBtnsCont = $('<div>').addClass('routingbtnCont'),
		$rgtCont = $('<div>').addClass('rgtSectionCont d-flex flex-row-reverse align-items-center'),
		$hpBtn = $('<a>').attr({'id':self.hpBtnId}).addClass('btn btn-outline-dark my-2 my-sm-0 active').text(this.hpName),
		$fpBtn = $('<a>').attr({'id':self.fpBtnId}).addClass('btn btn-outline-dark my-2 my-sm-0').text(this.fpName);
		$darkModeSwitchCont =  $('<div>').addClass('custom-control custom-switch'),
		$darkModeLabel = $('<label>').attr('for','darkModeSwitch').addClass('custom-control-label').html('<span class="modeText">Dark</span>'),
		$darkModeInp = $('<input>').attr({'id':'darkModeSwitch','type':'checkbox','checked':'true'}).addClass('custom-control-input').on('change',function(){
			let $html = $('html');	
			$html.attr('data-theme', self.themeMode ? 'light' : 'dark');

			self.themeMode =  self.themeMode ? 0 : 1;
		});

		$barsBtn = $('<i>').attr({'id':'bars'}).addClass('fas fa-bars').on('click',function(){
			let hasBarsClass = $(this).hasClass('fas fa-bars');
			$(this).toggleClass('fixed')
				.removeClass(hasBarsClass ? 'fa-bars' : 'fa-times')
				.addClass(hasBarsClass ? 'fa-times' : 'fa-bars');

			$('.routingbtnCont').toggleClass('fixed');
		});

		$body.append(
			$appCont.append(
				$nav.append( $navLink.append($navLinkTxt) )
					.append( $rotatingIcoCont.append($rotatingIco) )
					.append( 
						$rgtCont
							.append($barsBtn)
							.append($routingBtnsCont.append($hpBtn).append($fpBtn)) 
							.append($darkModeSwitchCont.append($darkModeInp).append($darkModeLabel))
					)
			)
		);

		$app = $('#'+self.appCont);
		$app.find('#'+self.hpBtnId).on("click", function(e){self._switchPage(e)});
		$app.find('#'+self.fpBtnId).on("click", function(e){self._switchPage(e)});
	},
	_buildHomePageSearchCont:function(){
		let self = this , $app = $('#'+(self.appCont)) , $body = $('body');

		let $hp = $('<page>').attr('id',self.hpName).addClass('page show');
		$hpInnrCont = $('<div>').addClass('container d-flex flex-column justify-content-center align-items-center'),
		$hpSrchCont = $('<div>').attr('id','searchContainer').addClass('input-group d-flex flex-column'),
		$hpMainTtl = $('<h3>').addClass('mainTitle').text('Welcome To Weather Forecast App'),
		$hpSrchContInp = $('<input>').attr({'id':'searchInput','type':'text','placeholder':'Your Location...'}).addClass('form-control'),
		$errMsg = $('<span>').attr({'id':'searchErrText'}).text('only english letters allowed, try again.'),
		$locDtls = $('<div>').addClass('locationDetails'),
		$btmContent = $('<div>').addClass('bottomContent d-flex flex-wrap'),
		$tempUnitLabel = $('<label>').attr('for','tempUnitSwitch').addClass('custom-control-label').html('<span id="unitText">Unit : C°</span>'),
		$tempUnitSwitchCont =  $('<div>').addClass('custom-control custom-switch tempUnitSwitchCont'),
		$tempUnitInp = $('<input>').attr({'id':'tempUnitSwitch','type':'checkbox','checked':'true'}).addClass('custom-control-input').on('change',function(){
			let $unitText = $('#unitText');
			self.temprUnitCode = self.temprUnitCode ? 0 : 1;

			if(self.temprUnitCode) return $unitText.text('Unit : C°');
			$unitText.text('Unit : F°');
		});
		
		$body.append(
			$app.append(
				$hp.append(
					$hpInnrCont
						.append( 
							$hpSrchCont
								.append($hpMainTtl)
								.append($hpSrchContInp).append($errMsg).append( $tempUnitSwitchCont.append($tempUnitInp).append($tempUnitLabel) ) 
						)
						.append( $locDtls.append($btmContent) )
				)
			)
		);

		$body.on('click',function(){
			let $list = $app.find('.locationsList');
			
			if(!$list.length) return;
			$list.remove();
		});

		$app.find('#'+self.srchInpId).on("keydown", function(e){
			self._getLocations(e);
		});
	},
	_buildFavoritesPage:function(){
		let self = this, 
		$fp = $('<page>').attr('id',self.fpName).addClass('favorites page d-flex justify-content-center'),
		$app = $('#'+self.appCont);

		$app.append($fp);
	},
	_buildHomePageLocationCont:function(forecastObj){
		let self = this,
		fiveDaysArr = (forecastObj['DailyForecasts'] || []),
		$topContent = $('.topContent'),
		$btmContent = $('.bottomContent');

		if(!fiveDaysArr.length) return;

		if($btmContent.length) $btmContent.html('');
		
		if($topContent.length) $topContent.html('');
		else $topContent = $('<div>').addClass('topContent d-flex justify-content-between');

		let $lftSection = $("<div>").addClass('lftSection d-flex'), 
		$lftCont = $("<div>").addClass('lftCont'),
		$lftBox = $("<div>").addClass('lftBox'),
		$lftBoxImgCont = $("<div>").addClass('lftBoxImgCont'),
		$lftBoxImg = $("<img>").attr('src','./assets/images/tlv.jpg').addClass('lftBoxImg'),
		$rgtBox = $("<div>").addClass('rgtCont d-flex justify-content-center flex-column align-items-center'),
		$rgtBoxLocationName = $("<div>").addClass('rgtContLocationName').text(forecastObj.Name), 
		$rgtBoxLocationTemp = $("<div>").addClass('rgtContLocationTemp').text(
			(forecastObj.weatherDetails[0].Temperature[ forecastObj.Unit ? 'Metric' : 'Imperial'].Value) + ' ' + 
			((forecastObj.Unit ? ' C' : 'F') +'°')
		),
		$rgtBoxLocationDesc = $("<div>").addClass('rgtContLocationDesc').text(forecastObj.Headline),
		$rgtSection = $("<div>").addClass('rgtSection d-flex align-items-center'),
		$rgtSectionIco = $("<i>").addClass('fas fa-heart').attr('id','heartIco').on('click', function(){
			$(this)[$(this).hasClass('red') ? 'removeClass' : 'addClass']('red');

			if(!self.favLocations[self.currLoctDtls.Key]) return self.favLocations[self.currLoctDtls.Key] = self.currLoctDtls;
			delete self.favLocations[self.currLoctDtls.Key];
		});
		
		$('.locationDetails').prepend(
			$topContent.append(
				$lftSection.append( 
					$lftCont.append($lftBox.append($lftBoxImgCont.append($lftBoxImg))) 
				).append($rgtBox.append($rgtBoxLocationName).append($rgtBoxLocationTemp).append($rgtBoxLocationDesc))
			).append($rgtSection.append($rgtSectionIco))
		);

		for(dayObj of fiveDaysArr){
			self._buildForecastCard(dayObj)
		}

		self._hideLoader();
	},
	_buildForecastCard:function(dayObj){		
		let self = this, 
		dayImgSrc = nightImgSrc = './assets/images/missing.svg',
		splittedTtlDay = (dayObj.Day.IconPhrase ? dayObj.Day.IconPhrase.split(' ') : []),
		splittedTtlNight = (dayObj.Night.IconPhrase ? dayObj.Night.IconPhrase.split(' ') : []),
		dayObjPhrases = splittedTtlDay.map(function(x){ return x.toLowerCase(); }),
		nightObjPhrases = splittedTtlNight.map(function(x){ return x.toLowerCase(); });

		for(let i in self.phrasesImgsObj){
			if(dayObjPhrases.includes(i)){
				dayImgSrc = self.phrasesImgsObj[i];
				break;
			}
		}
		
		for(let i in self.phrasesImgsObj){
			if(nightObjPhrases.includes(i)){
				nightImgSrc = self.phrasesImgsObj[i];
				break;
			}
		}

		let $btmContent = $('.bottomContent'),
		$card = $("<div>").addClass('card'),
		$cardMainTtl = $("<div>").addClass('card-main-title').text(moment(dayObj.Date, "YYYY-MM-DD HH:mm:ss").format('dddd')),
		$cardBody = $("<div>").addClass('card-body'),
		$tempr = $("<div>").addClass('temperature').html(
			'<div>'+ 
				(dayObj.Temperature.Maximum.Value + ' ' + (self.currLoctDtls.Unit ? 'C' : 'F') +'°') +
			'</div>'
		),
		$cardTtl = $("<h5>").addClass('card-title text-center').text('day'),
		$cardImg = $("<div>").addClass('card-img text-center');
		$weatherImg = $("<img>").addClass('weatherImg').attr('src',dayImgSrc);
		$hr = $("<hr>");

		$btmContent.append($card).append($hr);
		$cardImg.append($weatherImg);
		$cardBody.append($tempr).append($cardTtl).append($cardImg);
		$card.prepend($cardMainTtl).append($cardBody);
		
		$clonedCardBody = $cardBody.clone();
		$clonedCardBody.find('.card-title').text('night');
		$clonedCardBody.find('.temperature').html('<div>'+ dayObj.Temperature.Maximum.Value + dayObj.Temperature.Maximum.Unit +'</div>'),
		$clonedCardBody.find('.weatherImg').attr('src',nightImgSrc);
		
		$card.append($hr);
		$card.append($clonedCardBody);
		
	},
	_buildLocationsList:function(apiLocationsObj){
		let self = this , $srchCont = $("#searchContainer") , $locationList = $('.locationsList');    
		
		if($locationList.length) $locationList.remove();
		
		$locationList = $("<ul>");
		$locationList.addClass('locationsList show');

		for(loc of apiLocationsObj){
			$li = $('<li>');
			$li.text(loc.LocalizedName);
			$li.attr({"locationKey":loc.Key,'locationName':loc.LocalizedName}).addClass('locationListItem');
			$li.on('click', function(e){self._chooseLocation(e)});
			$locationList.append($li);
		}

		$srchCont.append($locationList);	
	},
	_getLocations:function(e){
		let self = this;
		
		setTimeout(function(){
			const eng_letters_regex = new RegExp(/^[a-zA-Z]+$/);
			let $errMsgEl = $('#searchErrText')
			
			if(e.target.c && !eng_letters_regex.test(e.target.value)) return $errMsgEl.addClass('show');
			if($errMsgEl.hasClass('show')) $errMsgEl.removeClass('show');

			if( e && e.target.value.length < 2 ) {
				let $locationsList = $('.locationsList');
				
				if($locationsList && $locationsList[0]) $locationsList.remove();
				return;
			}
	
			self._makeHttpRequest({
				url: self.GET_LOCATION_EP +'?apikey='+self.API_KEY+'&q='+e.target.value,
				callback:function(locations){
					self._buildLocationsList(locations);
				}
			});

		},100);
	},
	_chooseLocation:function(e){
		let self = this,
		$searchInput = $('#'+self.srchInpId),
		$locationsList = $('.locationsList');

		self._showLoader();

		$('.bottomContent').html('');
		$('.topContent').html('');
		$searchInput.val(e.target.innerText);

		if($locationsList.length) $locationsList.remove();
	
		let currLocationKey = e.target.getAttribute ? e.target.getAttribute('locationKey') : e.target.locationKey;
		
		self.currLoctDtls = {
			Key:currLocationKey,
			Name:e.target.innerText,
			Unit:self.temprUnitCode
		};

		let url = self.GET_5DAYFORECAST_EP + (currLocationKey || '') +'?apikey='+self.API_KEY+'&details=true' + (self.temprUnitCode ? '&metric=true' : '');
		
		const fiveDaysForecastProm = new Promise(function(resolve, reject) {
			self._makeHttpRequest({
				url: url,
				callback:function(forecastsObj){
					resolve(forecastsObj);
				}
			});
		});

		fiveDaysForecastProm.then(function(forecastsObj) {

			self.currLoctDtls.Headline = forecastsObj.Headline.Text;
			self.currLoctDtls.DailyForecasts = forecastsObj.DailyForecasts;
			
			self._makeHttpRequest({
				url: self.GET_WEATHER_EP + (currLocationKey || '') +'?apikey='+self.API_KEY+'&details=true&metric=true',
				callback:function(weatherObj){
					self.currLoctDtls.weatherDetails = weatherObj;
					self._buildHomePageLocationCont(self.currLoctDtls);
				}
			});			  
		})
	},
	_switchPage:function(e){
		let self = this,
		$btn = $('.btn'),
		$body = $('body'),
		$favPage = $('#'+self.fpName),
		$favCont = $('<div>').addClass('container favoritesContainer d-flex flex-wrap justify-content-center'),
		hasBarsClass = $(this).hasClass('fas fa-bars'),
		clickedBtnName = (e.target.id == self.hpBtnId ? self.hpName : self.fpName);

		$favPage.html('');

		$('#bars').removeClass(hasBarsClass ? 'fa-bars' : 'fa-times')
			.addClass(hasBarsClass ? 'fa-times' : 'fa-bars')
			.toggleClass('fixed');

		$('#'+self.hpName).removeClass('show');
		$('#'+self.fpName).removeClass('show');

		$btn.removeClass('active');
		$('#'+e.target.id).addClass('active');
		
		$('.routingbtnCont').toggleClass('fixed');

		if(clickedBtnName == 'favorites' && self.favLocations){
			for(let favItem in self.favLocations){

				let weatherTxt = self.favLocations[favItem].weatherDetails[0].WeatherText,
				temprVal = self.favLocations[favItem].weatherDetails[0].Temperature[self.favLocations[favItem].Unit ? 'Metric' : 'Imperial'].Value,
				temprUnit = ((self.favLocations[favItem].Unit ? 'C' : 'F') +'°'),
				temprText = temprVal + temprUnit;
								
				$card = $('<div>').addClass('card'),
				$cardBody = $('<div>').addClass('card-body'),
				$cardTtl = $('<h5>').addClass('card-title').text(self.favLocations[favItem].Name),
				$cardMainTxt = $('<p>').addClass('card-text').text(self.favLocations[favItem].weatherDetails.WeatherText),
				$cardTempTxt = $('<p>').addClass('card-text').text(temprText);
				$cardWeatherTxt = $('<p>').addClass('card-text').text(weatherTxt);
				
				$card.on('click',function(){
					self.currLoctDtls = self.favLocations[favItem];
					self._buildHomePageLocationCont(self.favLocations[favItem]);
					self._switchPage({target:{id:self.hpBtnId}});
					$('#searchInput').val(self.favLocations[favItem].Name);
				});

				$favPage.append(
					$favCont.append(
						$card.append(
							$cardBody.append($cardTtl).append($cardTempTxt).append($cardMainTxt).append($cardWeatherTxt)
						)
					)
				);

			}
		}

		if( self.favLocations && self.currLoctDtls.Key && self.favLocations[self.currLoctDtls.Key]) $('#heartIco').addClass('red');
		else $('#heartIco').removeClass('red');

		$('.page').removeClass('animated zoomIn faster');
	   	$('#'+clickedBtnName).addClass('animated zoomIn faster show');
	  	$body.addClass('overflow-hidden');
	  
		setTimeout(function(){
			$body.removeClass('overflow-hidden');
		},3000);
	},
	_makeToast:function(options){
		let opt = options || {};
		toastBg = opt.background || '#d4edda',
		toastColor = opt.color || '#155724',
		toastBorder = opt.border || '#c3e6cb',
		toastText = opt.text || 'your text here';

		let $toast = $('<div>').addClass('toaster'),
		$toastText = $('<span>').addClass('text').css({'background':toastBg,'color':toastColor,'border-color':toastBorder}).text(toastText);
		
		if(!$('.toaster').length) $('body').append($toast.append($toastText));
		if($('.loader').length) $('.loader').remove();
		
		setTimeout(function(){
			$toast.addClass('show');
		},100);

		setTimeout(function(){
			$toast.removeClass('show');
		},4500);

		setTimeout(function(){
			$toast.remove();
		},5000);

	},
	_showLoader:function(){
		let $loader = $('<div>').addClass('loader');
		$('.container').append($loader);	
	},
	_hideLoader:function(){
		let $loader = $('.loader');
		if($loader.length) $loader.remove();
	},
   _makeHttpRequest:function(options){
		let opt = options || {},
		url = opt.url || '',
		successCallback = opt.callback || null,
		self = this;

		try{
			$.ajax({
				type: "GET",
				url: url,
				dataType: "jsonp",
				cache: true,
				success: function (data) { 
					if(successCallback) successCallback(data); 
				},
				error: function(xhr){
					self._makeToast({
						text:self.errDict[xhr.status] || 'Unknown Error',
						background:'#000',
						color:'#E94B3C',
						border:'#E94B3C'
					});
				}
			});
		}catch(e){self._makeToast({text:e});}
	}
});

let WeatherForecastApp = new WeatherForecast({
	appCont:'app',
	homePageName:'home',
	favPageName:'favorites',
	homePageBtnId:'homeBtn',
	favPageBtnId:'favoritesBtn',
	searchInputId:'searchInput'
});
