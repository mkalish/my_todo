var Todos = new Meteor.Collection('todos');
var Lists = new Meteor.Collection('lists');

if (Meteor.isClient) {
    
    Meteor.autorun(function(){
        Meteor.subscribe('todos', Session.get('list'));
        Meteor.subscribe('lists');
    });

    Session.setDefault('todo_type', 'note');

    Session.setDefault('list', 'default');

    Template.todoList.todos = Todos.find();

    Template.todoList.lists = function(){
        return Lists.find();
    }

    Template.todoList.helpers({
        bulletType: function(bullet){
            var type = bullet.type;
            switch(type){
                case 'note': return "glyphicon glyphicon-stop";
                case 'todo': if(bullet.checked == false){
                                return "glyphicon glyphicon-unchecked todo";
                            } else{
                                return "glyphicon glyphicon-check todo";
                            };
                case 'event': return "glyphicon glyphicon-calendar";
             }
        },
        bulletSignifier: function(signifier) {
            switch(signifier){
                case 'priority': return "glyphicon glyphicon-star";
                case 'explore': return "glyphicon glyphicon-eye-open";
                case 'inspiration': return "glyphicon glyphicon-flash";
            }
        },
        listName: function(){
            return Session.get('list');
        }
    });

    Template.todoList.events({
        'click .todo': function(evt){
            $(evt.target).toggleClass('glyphicon-unchecked').toggleClass('glyphicon-check');    
            var todo_id = $(evt.target).closest('.todo_entry').attr('data-model');
            if($(evt.target).hasClass('glyphicon-unchecked')){
                Todos.update({'_id':todo_id},{'$set':{'checked':false}});
            } else {
                Todos.update({'_id':todo_id},{'$set':{'checked':true}});
            }
        },

        'click .list_entry': function(evt){
            Session.set('list', $(evt.target).attr('id'));
        },

        'click #add_list': function() {
            var list = $('#new_list').val();
            Lists.insert({name: list});
            $('#new_list').val('');
            Session.set('list', list);
        },

        'click .edit_todo': function(evt) {
            evt.preventDefault();
            var todo_id = $(evt.target).parent().siblings('.modal').attr('id');
            UI._templateInstance().currentBullet = Todos.findOne({_id: todo_id});
            $(evt.target).parent().siblings('.todo_edit').modal('show');
        },
        
        'click .submit_edit': function(evt) {
            var bullet  = UI._templateInstance().currentBullet;
            bullet.title = $(evt.target).siblings('.edit_title').val();
            Todos.update({_id: bullet._id}, bullet);
            $(evt.target).parents('.modal').modal('hide');
        }

    });

    Template.add_todo.created = function(){
        this.bullet = {}
    }

    Template.add_todo.events({
        'change #signifier' : function(evt) {
            UI._templateInstance().bullet.signifier = $(evt.target).val();
        },

        'change #todo_type': function(evt){
            var type = $(evt.target).val();
            UI._templateInstance().bullet.type = type;
            console.log('switching type to ' + type);
            if(Session.get('todo_type') != type) {
                Session.set('todo_type', type);
            }
        },

        'click #add_todo' : function(){
            UI._templateInstance().bullet.title = $('#title').val();
            UI._templateInstance().bullet.list = Session.get('list');
            Meteor.call('create_todo', UI._templateInstance().bullet, function(error, todo_id){
                $('#title').val('');
                $('.todo').hide();       
            });
            UI._templateInstance().bullet = {};
        }
    });


    Template.add_todo.helpers({
        todoTypeTemplate: function() {
            switch(Session.get('todo_type')){
                case 'note': return Template.note;
                case 'todo': return Template.note;
                case 'event': return Template.note;
            }
        }
    });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

    Meteor.publish('todos', function(list) {
        return Todos.find({list:list}, {list:0});
    });

    Meteor.publish('lists', function() {
        return Lists.find();
    })
    
    Meteor.methods({
        create_todo: function(todo){
            console.log('adding a todo to ' + todo.list);
            var todo_id = Todos.insert(todo);
            return todo_id;
        },
        lists: function(){
            var lists = _.uniq(Todos.find({}, {
                        sort: {list: 1}, fields: {list: true}
            }).fetch().map(function(x) {
                        return x.list;
            }), true);
            return lists;
        }
    });


}
