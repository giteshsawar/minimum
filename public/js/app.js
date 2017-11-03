'use strict';
    
    var app = angular.module("cardApp", ["ngRoute", "ngAnimate", "ngResource", "ngCookies"]).run(function($rootScope, $http, $window, $cookieStore, socket) {
        
        $rootScope.authenticated = $cookieStore.get('authenticate') ? $cookieStore.get('authenticate') : false;
        $rootScope.username = $cookieStore.get('username') ? $cookieStore.get('username'): "";

        $rootScope.logout = function() {

            $http.get('/auth/logout');    
            $rootScope.authenticated = false;
            $rootScope.username = "";
            $cookieStore.remove('username');
            $cookieStore.remove('authenticate');
            socket.emit('loggedOut');
        };
        
    });
        app.config(function($routeProvider) {
        
        $routeProvider
            .when('/', {
                    templateUrl: 'main.html',
                    controller: 'mainController'
            })
            .when('/table', {
                    templateUrl: 'table.html',
                    controller: 'groupController'
            });
    });