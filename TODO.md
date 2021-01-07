Updated Tedious to latest versions for security alert. Works, but messages:


- tedious deprecated 

The default value for "config.options.validateBulkLoadParameters" will change from `false` to `true` in the next major version of `tedious`. Set the value to `true` or `false` explicitly to silence this message. at load_db.js:106:24

- tedious deprecated 

In the next major version of `tedious`, creating a new `Connection` instance will no longer establish a connection to the server automatically. Please use the new `connect` helper function or call the `.connect` method on the newly created `Connection` object to silence this message. at internal/process/task_queues.js:79:11
