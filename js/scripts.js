
var app = angular.module("app", []);

// start form submit

app.directive('popupUrl', function () {
    return {
        scope: true,
        restrict: 'A',
        controller: function ($scope, $attrs, $element) {
            $element.bind('click', function () {
                console.log(
                    $attrs.popupUrl
                    , 'pop', 'width: ' + $attrs.popupWidth + ', height: ' + $attrs.popupHeight);


                window.open(
                    $attrs.popupUrl
                    , 'pop', 'width=' + $attrs.popupWidth + ', height=' + $attrs.popupHeight);
            });

        }
    };
});

app.directive("formSubmit", function () {
    return {
        scope: true,
        restrict: 'A',
        controller: function ($scope, $rootScope, $attrs, $element, $http) {
            $scope.errorsHandle = {};
            if (typeof ($scope.frm) === "undefined") $scope.frm = {};
            $element.bind('submit', function () {
                $.ajax({
                    type: onlyDefined($attrs.formMethod, "POST"),
                    url: $attrs.formSubmit,
                    data: $scope.frm,
                    success: function (msg, status, data) {
                        if (data.status === 200) {
                            if (typeof ($attrs.formResult) !== "undefined")
                                $scope[$attrs.formResult] = data.responseJSON;
                            if (typeof ($attrs.formRootResult) !== "undefined")
                                $rootScope[$attrs.formRootResult] = data.responseJSON;
                            $scope.$apply(function () {
                                $scope.errorsHandle = {};
                                if (typeof ($attrs.ngSuccess) !== "undefined")
                                    $scope.$eval($attrs.ngSuccess);
                                if (typeof ($attrs.ngSuccessUrl) !== "undefined")
                                    window.location = $attrs.ngSuccessUrl;
                            });
                        }
                    },
                    error: function (data) {
                        if (data.status === 400) {
                            data.responseJSON.forEach(function (e) {
                                $scope.$apply(function () {
                                    $scope.errorsHandle[e.key] = e.errors;
                                });
                            });
                        }
                    },
                    //dataType: "json",
                    //contentType: "application/json"
                });
                //$.post($attrs.formSubmit, $scope.frm, function (d) {
                //    $scope.$apply(function () {
                //        if (d.success === "Done") {
                //            $scope.errorsHandle = {};
                //            $scope.$eval($attrs.ngSuccess);
                //            return;
                //        }
                //        d.forEach(function (e) {
                //            $scope.errorsHandle[e.key] = e.errors;
                //        });
                //    });
                //});
            });

        }
    };
});

app.directive("ngInputInfo", function () {
    return {
        restrict: 'A',
        scope: true,
        controller: function ($scope, $attrs, $element) {
            //$scope.$watch("val", function (val) {
            //    $scope.$parent.frm[$attrs.ngInputInfo] = $scope.val;
            //});
            //$scope.$parent.$watch('frm.' + $attrs.ngInputInfo, fo)
            $scope.$parent.$watch("errorsHandle." + $attrs.ngInputInfo, function (err) {
                if (typeof (err) === "undefined") err = [];
                $scope.errors = err;
                if (err.length === 0)
                    $element.removeClass("has-error");
                else
                    $element.addClass("has-error");
            });
        }
    };
});


// end form submit


// start select

app.directive("selectUrl", function () {
    return {
        restrict: 'A',
        scope: true,
        controller: function ($scope, $element, $attrs) {
            $scope.selected = 0;
            $scope.display = $attrs.selectText;

            $scope.UpdateSearch = function () {
                var key = typeof ($attrs.selectFilter) === "undefined" ?
                             "filters." + $attrs.selectModel : $attrs.selectFilter;
                var data = typeof (key) === "undefined" ?
                    $scope.filter : fetchObj($scope.$parent, key);

                $.ajax({
                    type: "GET",
                    url: $attrs.selectUrl,
                    data: data,
                    success: function (msg, status, data) {
                        if (data.status === 200) {
                            $scope.$apply(function () {
                                $scope.options = data.responseJSON;
                            });
                            
                        }
                    }
                });
                
            };


            $scope.$watch('filter', $scope.UpdateSearch, true);
        }
    };
});

app.directive("selectModel", function () {
    return {
        restrict: 'A',
        scope: true,
        controller: function ($scope, $attrs) {

            var model = onlyDefined($attrs.selectFilter, "filters." + $attrs.selectModel);

            if ($scope.$parent !== null) {
                if ($scope.$parent.filters === null)
                    $scope.$parent.filters = {};
                $scope.$watch('filter', function () {
                    if (typeof ($scope.filter) === "undefined") return;
                    addKeyVal($scope.$parent, model, $scope.filter);
                }, true);
                $scope.$parent.$watch(model, $scope.UpdateSearch);
            }

            $scope.setValue = function (opt) {
                if (typeof (opt) === "undefined")
                    opt = { text: $attrs.selectText };

                $scope.display = opt.text;
                var model = $attrs.selectModel;

                var scope = $scope.$parent;
                if (scope === null) scope = $scope;
                addKeyVal(scope, "displays." + model, opt.text);
                addKeyVal(scope, model, opt.value);
            }

        }
    }
});

app.directive("selectOption", function () {
    return {
        restrict: 'A',
        scope: true,
        controller: function ($scope, $element) {
            var opt = $scope.$parent.option;
            
            $element.bind('click', function () {

                $scope.$parent.$parent.$apply(function ($scope) {
                    var setV = $scope.setValue;
                    if (typeof (setV) !== "undefined") {
                        setV(opt);
                    }
                });
            });
            if (typeof (opt) !== "undefined")
                $scope.display = opt.text;
        }
    };
});

// end select


function addKeyVal(obj, key, val) {

    var curr = obj;
    var keys = key.split(".");
    for (var i = 0; i < keys.length - 1; i++) {
        if (typeof (curr[keys[i]]) === "undefined")
            curr[keys[i]] = {};
        curr = curr[keys[i]];
    }
    if (typeof (curr[keys[i]]) === "object" && typeof (val) === "object")
        pushObj(curr[keys[i]], val);
    else
        curr[keys[i]] = val;
}

function pushObj(src, dest) {
    for (var k in dest) {
        if (typeof (src[k]) === "object") {
            pushObj(src[k], dest[k]);
        }
        else{
            src[k] = dest[k];
        }
    }
}

function fetchObj(obj, key) {
    var curr = obj;
    key.split(".").forEach(function (k) {
        if (typeof (curr) === "undefined") return;
        curr = curr[k];
    });
    return curr;
}

function isDefined(obj, key) {
    return typeof (key) !== "undefined" && typeof (obj[key]) !== "undefined";
}

function onlyDefined(v1, v2) {
    return typeof (v1) === "undefined" ? v2: v1;
}