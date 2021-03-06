'use strict';
   // INSTALL:  bower install manviny/manviny.dreamfactory --save
  /**
   * @memberof manviny.dreamfactory
   * @ngdoc module
   * @name dreamfactory
   * @param {service} $q promises
   * @description 
   *   Manage all related fucntions to chat
   */ 

	angular.module('manviny.dreamfactory', [])


    /**
     * user global
     * @memberof manviny
     * @ngdoc run     
     * @name log        
     */
	.run(function($log){
	    $log.debug("App running")
	})

    /**
     * user global
     * @memberof manviny
     * @ngdoc run  
     * @name rootScope           
     */
	.run(['$rootScope', function ($rootScope) {
			try {
				$rootScope.user = JSON.parse(window.localStorage.user)
			} catch (e) {}
		}
	])

    /**
     * @memberof manviny
     * @ngdoc factory     
     * @name httpInterceptor       
     * @desc
     *  . **Creates** user  in DinamoDB  
     *  . saves user in phone  
     * @param {String} name debe ser un email
     */
	.factory('httpInterceptor', function (INSTANCE_URL) {
	 return {
		  request: function (config) {
		   // Prepend instance url before every api call
		   if (config.url.indexOf('/api/v2') > -1) {
		       config.url = INSTANCE_URL + config.url;
		   };
		    return config;
	    }
	  }
	})


    /**
     * httpProvider
     * @memberof manviny
     * @ngdoc config   
     * @name httpProvider  
     */
    .config([ '$httpProvider', function ($httpProvider) {
     	$httpProvider.interceptors.push('httpInterceptor');
     }
    ])

    /**
     * '$http', 'DSP_API_KEY'
     * @memberof manviny
     * @ngdoc run  
     * @name DSP_API_KEY          
     */
	.run(['$http', 'DSP_API_KEY',function ($http, DSP_API_KEY) {
	   $http.defaults.headers.common['X-Dreamfactory-API-Key'] = DSP_API_KEY;
	 }])


	/**
	* UPLOAD FILES
	* @memberof DFS3
    * @ngdoc directive   		
	* @param {path}  path from where to get content
	* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
    * @example
    *   Usage:
    *   		<input type="file" file-model="myFile" />
	*			<button ng-click="uploadFile()">upload me</button>		
	*/	
	.directive('fileModel', ['$parse', function ($parse) {
	    return {
	        restrict: 'A',
	        link: function(scope, element, attrs) {
	            var model = $parse(attrs.fileModel);
	            var modelSetter = model.assign;
	            
	            element.bind('change', function(){
	                scope.$apply(function(){
	                    modelSetter(scope, element[0].files);
	                });
	            });
	        }
	    };
	}])

	.directive('fileChange', [
	    function() {
	        return {
	            link: function(scope, element, attrs) {
	                element[0].onchange = function() {
	                    scope[attrs['fileChange']](element[0])
	                }
	            }
	            
	        }
	    }
	])    
    


	/**
     * @memberof manviny	
	 * @ngdoc service
	 * @name DFS3
	 * @description
	 *   Services to use S3
	 */     
	.service('AWS',  function ($http, $q, $rootScope) {

		// var userPath = '/api/v2/'+ BUCKET + '/';

		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.login = function (creds) {
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'http://indinet.es/aws/login/',
	  			// data: {'user': creds.email, 'pass': creds.password}
	  			data: {'user': 'manolfiction', 'pass': creds.password}
	  		})
	  		.success(function (result) {
	  			console.log("LOGEADO",result)
				deferred.resolve(result);
	  		})
	  		.error(function(data){
	  			console.log("NO LOGEADO",data)
	  			deferred.reject;
			});	
			return deferred.promise;
		}


		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.ListObjects = function ( path) { 
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'http://indinet.es/aws/listobjects/',
	  			data: {'prefix': path}
	  		})
	  		.success(function (result) { deferred.resolve(result);alert("j2") })
	  		.error(function(data){ deferred.reject; alert("j3")});	
			return deferred.promise;
		}

///////////////////////////////////////////////////
//					ADAPTAR
///////////////////////////////////////////////////
		/**
		* creates FILE in S3, its content is data
		* @memberof DFS3
	 	* @function createFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFile = function (path, file, data) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file), data ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

		/**
		* get  FILE from S3
		* @memberof DFS3
	 	* @function getFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.getFile = function (path, file, download) {
			// if(download) download = '?download=true';
			download = download ? '?download=true' : '';
			console.debug("DOWNLOAD", this.getPath(path, file)+ download );
			var deferred = $q.defer();


			$http.get( this.getPath(path, file)+ download )
			.then(function (result) {
				if(download!='') {			// Descargar ichero
				    var anchor = angular.element('<a/>');
				    anchor.attr(
				    {
				        href: 'data:text/html;charset=utf-8,' + (result),
				        // href: 'data:image/png,' + encodeURI(result.data),
				        target: '_blank',
				        download: file
				    }
				    )[0].click();						
				}
				// Devolver metadata
				deferred.resolve(result.data);
			}, deferred.reject);


			return deferred.promise;
		};


		/**
		* deletes  file in S3
		* @memberof DFS3
	 	* @function deleteFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.deleteFile = function (path, file) {
			console.log(this.getPath(path, file))
			var deferred = $q.defer();
			$http.delete( this.getPath(path, file) ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

		/**
		* creates FOLDER file in S3
		* @memberof DFS3ΩΩΩ
	 	* @function createFolder	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFolder = function (path, file) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file) + '/' ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};


		/**
		* converts path to Breadcrumbs
		* @memberof DFS3
	 	* @function pathToBreadcrumb	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.pathToBreadcrumbs = function (path) {
			
			var breadcrumbs = path.split('/');
			breadcrumbs.pop(); 
			return breadcrumbs;
		};

		/**
		* converts Breadcrumbs to path 
		* @memberof DFS3ΩΩΩ
	 	* @function breadcrumbToPath	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.breadcrumbsToPath = function (name) {

		};

		/**
		* Uploads a file to S3
		* @memberof DFS3
	 	* @function uploadFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.uploadFile = function (path, file) {

			var deferred = $q.defer();

		    var fd = new FormData();
		    fd.append("files", file);

		    $http.post( this.getPath(path, file.name) , fd, {	
		        headers: {'Content-Type': undefined },
		        transformRequest: angular.identity
		    })  
		    .success(function(data){
		    	deferred.resolve(data);
			})
			.error(function(data){
		    	deferred.reject(data);
			});	

			return deferred.promise;

		};

		// calula el path 
		this.getPath = function (path, name) {
			console.debug(path, name);
			var url = userPath;
			if(path=='/' || path=='') { url = url + name }
			else { url = url + path.replace(/^\/|\/$/g, '')  + '/' + name}
			console.debug(url);
			return url;
		};




	}) //AWS


	/**
     * @memberof manviny	
	 * @ngdoc service
	 * @name DFUser
	 * @description
	 *   allows login, register and logout
	 */     
	.service('DFUser', [ '$http', '$q', '$rootScope', function ($http, $q, $rootScope) {

	    /**
	     * set default header for every call
	     * @memberof DFUser
	     * @function handleResult
	 	 * @name handleResult	     
		 * @param {result} 
		 * @returns {data} data
	     */		 	
		var handleResult = function (result) {
			$http.defaults.headers.common['X-DreamFactory-Session-Token'] = result.data.session_token;
			$rootScope.user = result.data
		};

		/**
		* login user
		* @memberof DFUser
	 	* @function login	 		
		* @param {creds} email,password
		* @returns {Hash} filterd attributes
		*/
		this.login = function (creds) {
			var deferred = $q.defer();
			$http.post('/api/v2/user/session', creds).then(function (result) {
				 handleResult(result);
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

   //register new user
	//    this.register = function () {
	//     var deferred = $q.defer();
	//     $http.post('/api/v2/user/register?login=true', options).then(function (result) {
	//      handleResult(result)
	//      deferred.resolve(result.data);
	//     }, deferred.reject);
	//     return deferred.promise;
	//    }

		/**
		* logout user
		* @memberof DFUser
	 	* @function logout	 		
		* @param {creds} email,password
		* @returns {Hash} filterd attributes
		*/
		this.logout = function (creds) {
			var deferred = $q.defer();
      		$http({
      			method: 'DELETE',
      			url: '/api/v2/user/session'
      		}).success(function (result) {
      			$rootScope.user = '';
      			delete $http.defaults.headers.common['X-DreamFactory-Session-Token'];
      			deferred.resolve(result);
      		})
      		.error(function(data){
      			$rootScope.user = '';
      			delete $http.defaults.headers.common['X-DreamFactory-Session-Token'];      			
		    	deferred.reject(data);
			});	
			return deferred.promise;
		};

		/**
		* register new user
		* @memberof DFUser
	 	* @function register	 			
		* @param {creds} email,password,first_name,last_name
		* @returns {Hash} filterd attributes
		*/
		this.register = function () {
			var deferred = $q.defer();
			$http.post('/api/v2/user/register?login=true', options).then(function (result) {
				handleResult(result)
				deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		}

		/**
		* register new user
		* @memberof DFUser
	 	* @function getRole	 			
		* @param {creds} email,password,first_name,last_name
		* @returns {Hash} filterd attributes
		*/
		this.getRole = function (roleID) {
			var deferred = $q.defer();
			$http({
			  method: 'POST',
			  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			  url: 'http://dreamfactory.jrc-sistemas-naturales.bitnamiapp.com/rest/system/script/userrole/',
			  data: $.param({ is_user_script:true, id:roleID }), // Make sure to inject the service
			})
			.success(function(response) { 
				console.debug("role data",response.script_result); 
				deferred.resolve(response.script_result)
			});
			return deferred.promise;
		}


	}])


	/**
     * @memberof manviny	
	 * @ngdoc service
	 * @name DFS3
	 * @description
	 *   Services to use S3
	 */     
	.service('DFS3', [ '$http', '$q', '$rootScope','BUCKET', function ($http, $q, $rootScope, BUCKET) {

		var userPath = '/api/v2/'+ BUCKET + '/';
		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.getBucketContent = function (path) {
			console.debug("usuario", $rootScope.user)
			var files = []; var folders = [];
			if(path==undefined) path = '';

			var deferred = $q.defer();
			$http.get(userPath + path.replace(/^\/|\/$/g, '') +'/?include_folders=true&include_files=true').then(function (result) {
				angular.forEach(result.data.resource, function(value) {
					if (value.name.charAt(0)!='.'){							// fichero oculto
						if(value.type=='folder'){ folders.push(value) }
						else { files.push(value) }
					}
				});
				deferred.resolve({files:files, folders:folders});
			}, deferred.reject);
			return deferred.promise;
		};
		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.getS3Content = function (bucket, path) {
			console.debug("usuario", $rootScope.user)
			var files = []; var folders = [];
			if(path==undefined) path = '';

			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			// url: 'http://indinet.es/aws/getBucket/',
	  			url: 'http://indinet.es/aws/listBuckets/',
	  			data: {'role':'jrc', 'bucket':bucket, 'prefix': path}
	  		}).success(function (result) {
	  			console.log("KKKKK",result)
				angular.forEach(result, function(value) {
					if (value.Key.charAt(0)!='.'){							// fichero oculto
						if(value.Key.slice(-1)=='/'){ folders.push(value) }
						else { files.push(value) }
					}
				});
	  			deferred.resolve({files:files, folders:folders});
	  		})
	  		.error(function(data){
	  			deferred.reject
			});	
			return deferred.promise;
		};

		/**
		* get paths from the given path (all levels under this path)
		* @memberof DFS3
	 	* @function getPaths	 		
		* @param {path} root path from where to get paths
		* @returns {Array} array o Strings with paths
	    * @example
	    *   Usage:
	    *   		DFS3.getPaths( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.getPathsRecursive = function (path) {
			if(path==undefined) path = '';
			var paths = [];
			var deferred = $q.defer();

			// quita primer y ultimo '/'
			$http.get(userPath + path.replace(/^\/|\/$/g, '') +'/?as_list=true&as_access_list=true')
		    .success(function(result){
				angular.forEach(result.data.resource, function(value) {
					if(value.slice(-1)!='*') paths.push(value.slice(0, -1));				// quita rutas que terminan en *
				});
		    	deferred.resolve(paths);
			})
			.error(function(data){
		    	deferred.reject(data);
			});	

		
			return deferred.promise;
		};

		/**
		* creates FILE in S3, its content is data
		* @memberof DFS3
	 	* @function createFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFile = function (path, file, data) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file), data ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

		/**
		* get  FILE from S3
		* @memberof DFS3
	 	* @function getFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.getFile = function (path, file, download) {
			// if(download) download = '?download=true';
			download = download ? '?download=true' : '';
			console.debug("DOWNLOAD", this.getPath(path, file)+ download );
			var deferred = $q.defer();


			$http.get( this.getPath(path, file)+ download )
			.then(function (result) {
				if(download!='') {			// Descargar ichero
				    var anchor = angular.element('<a/>');
				    anchor.attr(
				    {
				        href: 'data:text/html;charset=utf-8,' + (result),
				        // href: 'data:image/png,' + encodeURI(result.data),
				        target: '_blank',
				        download: file
				    }
				    )[0].click();						
				}
				// Devolver metadata
				deferred.resolve(result.data);
			}, deferred.reject);


			return deferred.promise;
		};


		/**
		* deletes  file in S3
		* @memberof DFS3
	 	* @function deleteFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.deleteFile = function (path, file) {
			console.log(this.getPath(path, file))
			var deferred = $q.defer();
			$http.delete( this.getPath(path, file) ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

		/**
		* creates FOLDER file in S3
		* @memberof DFS3ΩΩΩ
	 	* @function createFolder	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFolder = function (path, file) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file) + '/' ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};


		/**
		* converts path to Breadcrumbs
		* @memberof DFS3
	 	* @function pathToBreadcrumb	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.pathToBreadcrumbs = function (path) {
			
			var breadcrumbs = path.split('/');
			breadcrumbs.pop(); 
			return breadcrumbs;
		};

		/**
		* converts Breadcrumbs to path 
		* @memberof DFS3ΩΩΩ
	 	* @function breadcrumbToPath	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.breadcrumbsToPath = function (name) {

		};

		/**
		* Uploads a file to S3
		* @memberof DFS3
	 	* @function uploadFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.uploadFile = function (path, file) {

			var deferred = $q.defer();

		    var fd = new FormData();
		    fd.append("files", file);

		    $http.post( this.getPath(path, file.name) , fd, {	
		        headers: {'Content-Type': undefined },
		        transformRequest: angular.identity
		    })  
		    .success(function(data){
		    	deferred.resolve(data);
			})
			.error(function(data){
		    	deferred.reject(data);
			});	

			return deferred.promise;

		};

		// calula el path 
		this.getPath = function (path, name) {
			console.debug(path, name);
			var url = userPath;
			if(path=='/' || path=='') { url = url + name }
			else { url = url + path.replace(/^\/|\/$/g, '')  + '/' + name}
			console.debug(url);
			return url;
		};


	}])


