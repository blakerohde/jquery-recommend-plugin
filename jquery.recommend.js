/**
 * recommend jQuery Plugin (https://github.com/blakerohde/jquery-recommend-plugin)
 * 
 * Copyright (c) 2010-2012 Blake Rohde (http://www.blakerohde.com/)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($) {
	$.recommend = function(options) {
		// Set default settings and override with options, if sent in
		// settings.css.recommend_to_remove : CSS class to remove from each selector match (for multiple, seperate each by a space)
		var settings = $.extend(true, {
			'cookie_name' : 'recommended',
			'css_class' : {
				'recommend_count' : 'recommend_count_',
				'recommend_init' : 'recommend_',
				'recommend_to_remove' : 'noShow',
				'recommend_link' : 'recommend_link_'
			},
			'debug' : false,
			'url' : {
				'ajax_path' : 'ajax_path/',
				'base_path' : 'base_path/',
				'domain' : 'http://www.example.com/',
				'id_seperator' : '-'
			}
		}, options);
		
		// Define variables
		var cookie_contents = null;
		var request = {
			'ajax_path' : settings.url.ajax_path,
			'base_path' : settings.url.base_path,
			'domain' : settings.url.domain,
			'id' : '',
			'ids' : ''
		};
		var placeholders = $("[class*='" + settings.css_class.recommend_init + "']");
		
		/**
		 * log
		 */
		function log(message, override_debug) {
			if(override_debug == undefined) {
				override_debug = false;
			}
			//else
			
			if(settings.debug || override_debug) {
				console.log(message);
			}
			//else
		}
		
		/**
		 * appendRequestID
		 */
		function appendRequestID(id_string, new_id) {
			if(id_string != '') {
				id_string += settings.url.id_seperator;
			}
			//else
			
			id_string += new_id;
			
			return id_string;
		};
		
		/**
		 * getCookieContents
		 */
		function getCookieContents(cookie_name) {
			return $.cookie(cookie_name);
		};
		
		/**
		 * parseQueryStrings
		 */
		function parseQueryStrings(qs_kv_pairs) {
			var url_chunk = '';
			
			$.each(qs_kv_pairs, function(key, value) {
				if(url_chunk == '') {
					url_chunk += '?';
				}
				else {
					url_chunk += '&';
				}
				
				if(value == null || value == undefined) {
					value = '';
				}
				//else
				
				url_chunk += key + '=' + value;
			});
			
			return url_chunk;
		};
	
		/**
		 * getRequestURL
		 */
		function getRequestURL(method, qs_kv_pairs_override, req_override) {
			if(method == undefined) {
				return false;
			}
			//else
			
			var tmp_request = $.extend(true, {
				'ajax_path' : request.ajax_path,
				'domain' : request.domain,
				'id' : request.id,
				'ids' : request.ids
			}, req_override);
			
			// Method needs to be added to the query string key-value pairs, so the parsed URL chunk can be generated
			var qs_kv_pairs = {
				'method' : method
			};
			
			// Increment the item's recommend count
			if(method == 'increment') {
				qs_kv_pairs = $.extend(true, qs_kv_pairs, {
					'id' : tmp_request.id
				});
			}
			// Get the recommend count totals for the ids
			else if(method == 'getCounts') {
				qs_kv_pairs = $.extend(true, qs_kv_pairs, {
					'ids' : tmp_request.ids
				});
			}
			// Unknown/undefined method
			else {
				return false;
			}
			
			// Override any key-value pairs with the passed in object
			qs_kv_pairs = $.extend(true, qs_kv_pairs, qs_kv_pairs_override);
			
			return tmp_request.domain + tmp_request.ajax_path + parseQueryStrings(qs_kv_pairs);
		};
		
		/**
		 * findIDMatch
		 */
		function findIDMatch(id_string, id_to_match) {
			var ids = id_string.split(settings.url.id_seperator);
			var ids_count = ids.length;
			for(var i=0;i < ids_count;++i) {
				if(ids[i] == id_to_match) {
					return true;
				}
				//else
			}
			
			return false;
		};
		
		/**
		 * main
		 */
		function main() {
			// Get the value of the cookie
			cookie_contents = getCookieContents(settings.cookie_name);
			if(cookie_contents == null) {
				cookie_contents = '';
			}
			//else
			
			// For each selector match, get its respective ID value and set the containers contents to 
			// 		either static text or a link (depending on if the user has already recommended the ID)
			placeholders.each(function() {
				var id = null;
				var css_classes = $(this).attr('class').split(' ');
				var css_classes_count = css_classes.length;
				for(var i=0;i < css_classes_count;++i) {
					if(css_classes[i].search(settings.css_class.recommend_init) == 0) {
						id = css_classes[i].substr(settings.css_class.recommend_init.length);
						break;
					}
					//else
				}
				
				if(id != null) {
					request['ids'] = appendRequestID(request.ids, id);
					
					$(this).removeClass(settings.css_class.recommend_to_remove);
					
					if(findIDMatch(cookie_contents, id) == false) {
						$(this).replaceWith('<a class="' + settings.css_class.recommend_link + id + '" href="#recommend' + id + '" title="Recommend this post">Recommend (<span class="' + settings.css_class.recommend_count + id + '">0</span>)</a>');
					}
					else {
						$(this).replaceWith('Recommended (<span class="' + settings.css_class.recommend_count + id + '">0</span>)');
					}
				}
				//else
			});
			
			// Get the current recommend counts for each ID and insert the respective values
			if(placeholders.size() > 0) {
				$.ajax({
					'dataType' : 'json',
					'error' : function() {
						log('Error.');
					},
					'success' : function(recommend_data) {
						var data_count = recommend_data.length;
						for(var i=0;i < data_count;++i) {
							$("span[class~='" + settings.css_class.recommend_count + recommend_data[i].id + "']").each(function() {
								$(this).html(recommend_data[i].count);
							});
						}
					},
					'url' : getRequestURL('getCounts')
				});
			}
			//else
			
			// When an available recommend link is clicked, we want to increment the value and make an AJAX call to save the incremented value
			$("a[class*='" + settings.css_class.recommend_link + "']").click(function() {
				var id = null;
				var current_recommend_count = $(this).children().eq(0).text();
				var css_classes = $(this).attr('class').split(' ');
				var css_classes_count = css_classes.length;
				for(var i=0;i < css_classes_count;++i) {
					if(css_classes[i].search(settings.css_class.recommend_link) == 0) {
						id = css_classes[i].substr(settings.css_class.recommend_link.length);
						break;
					}
					//else
				}
				
				if(id != null) {
					request['id'] = id;
					
					// Now that the user has recommended the item, remove the link
					$.ajax({
						'dataType' : 'json',
						'error' : function() {
							log('AJAX Error.');
						},
						'success' : function(recommend_data) {
							// Append the ID to the cookie_contents, so the link is disabled on next page load
							cookie_contents = appendRequestID(cookie_contents, id);
							$.cookie(settings.cookie_name, cookie_contents, {
								'expires' : 2555,
								'path' : request.base_url
							});
							
							$("span[class~='" + settings.css_class.recommend_count + recommend_data.id + "']").each(function() {
								$(this).hide().html(recommend_data.count).fadeIn('slow');
							});
						},
						'url' : getRequestURL('increment')
					});
					
					$(this).replaceWith('Recommended (<span class="' + settings.css_class.recommend_count + id + '">' + current_recommend_count + '</span>)');
				}
				else
					log('ID Error.');
				
				return false;
			});
		};
		
		main();
	};
})(jQuery);