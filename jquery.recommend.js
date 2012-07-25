/*!
 * jQuery Recommend Plugin v2.0.0
 * https://github.com/blakerohde/jquery-recommend-plugin
 * 
 * Copyright 2012, Blake Rohde
 * Dual licensed under the MIT or GPL Version 2 licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function( $, window, document, undefined ) {

var Recommend = (function() {
	
	return {
		
		/**
		 * init
		 * Perform setup for the plugin
		 */
		init: function( options, elem ) {
			var self = this;
			
			self.$this = elem;
			self.options = $.extend( {}, $.fn.recommend.options, options );
			
			return self;
		},
		
		/**
		 * logger
		 * The internal logging function
		 */
		logger: function( msg ) {
			var self = this;
			
			if( self.options.debug ) {
				return self.options.logger( msg );
			}
		},
		
		/**
		 * getCookieContents
		 * Returns the contents of self.options.cookie.name
		 */
		getCookieContents: function() {
			var self = this;

			var contents = self.options.cookie.processor( self.options.cookie.name )
			
			if( contents == null ) {
				return '';
			} else {
				return contents;
			}
		},
		
		/**
		 * getCookieIDs
		 * Get the IDs stored in the cookie
		 */
		getCookieIDs: function() {
			var self = this;
			
			var contents = self.getCookieContents();
			if( contents == '' ) {
				return []
			} else {
				return self.getCookieContents().split( self.options.id_seperator )
			}
		},
		
		/**
		 * getID
		 * Return the current elements ID (by getting the contents after the options.href_id_prefix)
		 */
		getID: function() {
			var self = this;
			
			return $( self.$this ).attr( 'href' ).substr( self.options.href_id_prefix.length );
		},
		
		/**
		 * deactivate
		 * Unwrap recommend links if the cookie has the link's ID
		 */
		deactivate: function() {
			var self = this;
			
			self.logger( self.getCookieIDs().indexOf( self.getID()) );
			if( self.getCookieIDs().indexOf(self.getID()) != -1 ) {
				self.logger( 'deactivate ' + self.getID() )
				
				// Replace the recommend label with the new value
                        	$( '[class~="' + self.options.classes.rlabel + '"]', self.$this ).replaceWith( self.options.replace_label );
				
				// Replace the element (an a tag) with a span
				var elem = $( document.createElement('span') ).append( $(self.$this).html() );
				$( self.$this ).replaceWith( elem );
				
				return self.$this = elem;
			}
			
			return self.$this;
		},
		
		/**
		 * getRequestURL
		 * Return the request URL used for the AJAX call triggered when recommending an item
		 */
		getRequestURL: function() {
			var self = this;
			
			if( self.options.request.type ) {
				return self.options.request.path + '?type=' + self.options.request.type + '&id=' + self.getID();
			} else {
				return self.options.request.path + '?id=' + self.getID();
			}
		},
		
		/**
		 * appendID
		 * Append the current id to the cookie
		 */
		appendID: function( id ) {
			var self = this;
			
			self.logger( self.getCookieIDs() );
			self.logger( (self.getCookieIDs().concat([id])).join(self.options.id_seperator) );
			self.options.cookie.processor(self.options.cookie.name, (self.getCookieIDs().concat([id])).join(self.options.id_seperator), {
				expires: 2555,
				path: '/'
			});
		},
		
		/**
		 * replace
		 * Replace the current recommend link with a span and update the recommend count
		 */
		replace: function( new_count ) {
			var self = this;
			
			// Replace the recommend count with the new value
			$( '[class~="' + self.options.classes.rnum + '"]', self.$this ).hide().html( new_count ).fadeIn( 'slow' );
			
			// Replace the recommend label with the new value
			$( '[class~="' + self.options.classes.rlabel + '"]', self.$this ).replaceWith( self.options.replace_label );
		},
		
		/**
		 * register
		 * Register an on-click listener for the selected element(s)
		 */
		register: function() {
			var self = this;
			
			self.logger( self.$this );
			
			if( $( self.$this ).attr( 'href' ) != undefined ) {
				$( self.$this ).click(function() {
					self.logger( 'click ' + self.getID() );
				
					$.ajax({
						dataType: 'json',
						error: function() {
							self.logger( 'AJAX Error' );
						},
						success: function( data ) {
							self.logger( data );
							
							self.appendID( data.id );
							self.deactivate();
							
							self.replace( data.count );
							
							$( self.$this ).off( 'click' );
						},
						url: self.getRequestURL()
					});
					
					return false;
				});
			}
			
			return self;
		}
		
	};
	
})();

$.fn.recommend = function( options ) {
	
	return this.each(function() {
		
		var recommend = $.extend( {}, Recommend );
		
		recommend.init( options, this );
		recommend.deactivate();
		recommend.register();
		
		$.data( this, 'recommend', recommend );
		
	});
};

$.fn.recommend.options = {
	
	// cookie: cookie related options
	cookie: {
		// cookie.name: The name of the cookie to store recommended IDs
		name: 'recommended',
		// cookie.processor: The plugin/method that handles cookies
		processor: $.cookie
	},
	// classes: CSS classes for selecting key children elements for content replacement/modification
	classes: {
		// classes.rlabel: The label to be replaced
		rlabel: 'rlabel',
		// classes.rnum: The current number of recommends
		rnum: 'rnum'
	},
	// debug: Toggle debug which will restrict logs, etc.
	debug: false,
	// href_id_prefix: The recommend link's href attribute prefix before the ID
	href_id_prefix: '#recommend-',
	// id_seperator: Seperator used to seperate IDs when storing in the cookie
	id_seperator: '-',
	// logger: The logging plugin/method that handles logging (for debugging)
	logger: function( msg ) { console.log(msg); },
	// replace_label: post-recommended label for classes.rlabel
	replace_label: 'Recommended',
	// request: options related to the AJAX request made when recommending an item
	request: {
		// request.path: The absolute or relative path for the AJAX calls
		path: '',
		// request.type: Optional: The content type for the item being recommended. If specified, a 'type' query string will be added to the request URL with the specified value
		type: ''
	}
	
};

})( jQuery, window, document );
