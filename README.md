# s3zip
Create a zipped stream from a list of files in an AWS S3 bucket

Optimized for minimal RAM usage:

- Even when large number of files;
- Even when client downloads slowly;
- Breaks it's execution on s3 key not exists error.

See examples/expressjs/app.js

QA:

Question:
Can we stream from an AWS lambda function?

Answer:
No, unfortunately. Streaming results is not supported in [AWS] javascript lambda functions (yet).
(I have heard that is supported only in Java labda functions).
One of the possible workarounds is: upload the resulting zipped stream back to s3 bucket and redirect the client to it.