const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("function can update 1 field", function () {
    const firstName = "FirstnameTest";
    
    const result = sqlForPartialUpdate(
        { firstName: firstName },
        { firstName: "first_name", age: "age" });
    expect(result).toEqual({
      setCols: "\"first_name\"=$1",
      values: [firstName],
    });
  });

  test("function can update 2 fields", function () {
    const firstName = "FirstnameTest";
    const age = 50;
    
    const result = sqlForPartialUpdate(
        { firstName: firstName, age: age },
        { firstName: "first_name", age: "age" });
    expect(result).toEqual({
      setCols: "\"first_name\"=$1, \"age\"=$2",
      values: [firstName, age],
    });
  });
});

