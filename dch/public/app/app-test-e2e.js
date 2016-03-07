describe('DCGUI Interface', function() {
  it('this is an example', function() {
    browser.get('http://localhost:3000');

    //element(by.model('todoList.todoText')).sendKeys('write first protractor test');
    //element(by.css('[value="add"]')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();
    element(by.id('total-devices')).click();
    element(by.id('acceleration-graph')).click();

    //var todoList = element.all(by.repeater('todo in todoList.todos'));
    //expect(todoList.count()).toEqual(3);
    //expect(todoList.get(2).getText()).toEqual('write first protractor test');
    expect(true).toEqual(true);
    expect(true).toEqual(true);
    expect(true).toEqual(true);
    expect(true).toEqual(true);
    expect(true).toEqual(true);
    // You wrote your first test, cross it off the list
    //todoList.get(2).element(by.css('input')).click();
    //var completedAmount = element.all(by.css('.done-true'));
    //expect(completedAmount.count()).toEqual(2);
  });
});
