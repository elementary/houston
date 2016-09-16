# test/lib/config

Tests the loading of configuration. It is in the form of a directory due to the
nature of configuration loading and mocking. It ensures that each test is ran in
a separate process, with unique mocked data so no test interferes.
