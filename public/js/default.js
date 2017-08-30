UPTODATE('1 day', '/');
PING('/api/ping/');

var common = {};
var firstcall = true;

SETTER(true, 'loading', 'hide');

ON('ready', function() {
	refresh_markdown();
	$(document).on('click', '.categorybutton', function() {
		$('.categories').tclass('categoriesshow');
	});
});

$(document).on('click', '.jrouting', function(e) {
	e.preventDefault();
	e.stopPropagation();
	var url = $(this).attr('href').substring(1);
	url = url.substring(0, url.length - 1);

	var item = common.items.findItem('url', url);
	if (item) {
		SETTER('tree', 'select', item.$pointer);
		SETTER('tree', 'expand', item.$pointer);
	}
});

function refresh_pages() {
	AJAX('GET /api/pages/', function(response) {

		function tree(parent) {
			var output = [];
			for (var i = 0, length = response.length; i < length; i++) {
				if (response[i].parent === parent) {
					if (!response[i].group)
						response[i].children = null;
					output.push(response[i]);
				}
			}
			return output;
		}

		var output = [];

		response.forEach(function(item) {
			item.children = tree(item.id);
			!item.children && item.group && (item.children = []);
			!item.parent && output.push(item);
		});

		SET('common.pages', output);
		SET('common.items', response);
		var sel = response.findItem('url', NAVIGATION.url.substring(1, NAVIGATION.url.length - 1));
		if (sel && sel.$pointer) {
			SETTER('tree', 'select', sel.$pointer);
			SETTER('tree', 'expand', sel.$pointer);
		}
	});
}

refresh_pages();

function treeclick(obj, is) {

	if (firstcall) {
		firstcall = false;
		return;
	}

	if (is)
		return;

	SETTER('loading', 'show');
	var url = '/{0}/'.format(obj.url);
	REDIRECT(url);
	$('.categories').rclass('categoriesshow');
	AJAX('GET ' + url, function(response) {
		document.title = obj.title;
		$('#preview').html(response);
		refresh_markdown();
		SETTER('loading', 'hide', 500);
	});
}

ON('#search', function(component) {

	if (component.config.type !== 'search')
		return;

	component.find('input').on('focus', function() {

		SETTER('autocomplete', 'attach', this, function(q, render) {

			var arr = [];
			var search = q.toSearch().split(' ').trim();

			search.length && common.items.forEach(function(item) {
				if (!item.search || item.group)
					return;
				for (var i = 0; i < search.length; i++) {
					if (item.search.indexOf(search[i]) === -1)
						return;
				}
				arr.push({ name: item.title, value: item.$pointer });
			});

			arr.length && render(arr);
		}, function(value) {
			firstcall = false;
			SETTER('tree', 'select', value.value);
			SETTER('tree', 'expand', value.value);
			SET('common.search', '');
		}, 13, -5, 40);
	});
});