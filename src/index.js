import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
// Slomux - реализация Flux, в которой, как следует из нвазвания, что-то сломано.
// Нужно выяснить что здесь сломано

const createStore = function (reducer, initialState = []) {
  let currentState = initialState;
  let listeners = [];

  const getState = () => currentState;
  const dispatch = action => {
    currentState = reducer(currentState, action);
    listeners.forEach(listener => listener());

    return action;
  };

  const subscribe = listener => {
    listeners.push(listener);
    // Функция для отписки
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  };

  return {
    getState,
    dispatch,
    subscribe
  };
};

const connect = (mapStateToProps, mapDispatchToProps) =>
    Component => {
      return class extends React.Component {
        static contextTypes = {
          store: PropTypes.object
        };

        render() {
          const { store } = this.context;
          return (
              <Component
                  {...this.props}
                  {...mapStateToProps(store.getState(), this.props)}
                  {...mapDispatchToProps(store.dispatch, this.props)}
              />
          )
        }

        componentDidMount() {
          const { store } = this.context;
          this.unsubscribe = store.subscribe(this.handleChange);
        }

        componentWillUnmount() {
          this.unsubscribe()
        }

        handleChange = () => this.forceUpdate()
      }
    };

class Provider extends React.Component {
  static childContextTypes = {
    store: PropTypes.object
  };

  componentWillMount() {
    window.store = this.props.store;
  }

  getChildContext() {
    return {
      store: this.props.store
    };
  }


  render() {
    return React.Children.only(this.props.children);
  }
}

// APP

// actions
const ADD_TODO = 'ADD_TODO';

// action creators
const addTodo = todo => ({
  type: ADD_TODO,
  payload: todo,
});

// reducers
const reducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      let newState = state.slice();
      newState.push(action.payload);
      return newState;
    default:
      return state;
  }
};

// components
class ToDoComponent extends React.Component {
  state = {
    todoText: ''
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.addTodo();
  };

  render() {
    const { title = 'Без названия', todos = [] } = this.props;
    const { todoText = '' } = this.state;
    return (
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="todoText">
            {title}
          </label>
          <div>
            <input
                id="todoText"
                name="todoText"
                value={todoText}
                placeholder="Название задачи"
                onChange={this.handleInputChange}
            />
            <button type='submit'>Добавить</button>
            <ul>
              {Array.isArray(todos) && todos.map((todo, idx) => <li key={idx}>{todo}</li>)}
            </ul>
          </div>
        </form>
    )
  }

  handleInputChange = (event) => {
    const target = event.target;
    const name = target.name;

    this.setState({
      [name]: target.value
    });
  };

  reset = () => {
    this.setState({
      todoText: ''
    });
  };

  addTodo = () => {
    const { todoText = '' } = this.state;
    if (todoText && todoText.trim()) {
      this.props.addTodo(todoText);
      this.reset();
    }
  }
}

const ToDo = connect(state => ({
  todos: state,
}), dispatch => ({
  addTodo: text => dispatch(addTodo(text)),
}))(ToDoComponent);

// init
const store = createStore(reducer, []);

ReactDOM.render(
    <Provider store={store}>
      <ToDo title="Список задач"/>
    </Provider>,
    document.getElementById('app')
);
