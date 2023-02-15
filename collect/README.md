# Setup collector

`submit.php`  is the source code for the setup collector. This is fully
anonymized and only triggerred when using https://mascaldotfr.github.io.

The client code [can be found here](https://github.com/mascaldotfr/CoRT/commit/677a0c6cac5f265a5cf7719857bf2db9a1b483e1).

It means that this collection does not enter in conflict with the ability to
easily deploy CoRT it as promised.

The dataset is available at: https://cortdata.000webhostapp.com/data/data.txt

## Data exploitation

A simple python exploit code can be found at [exploit.py](exploit.py) in this
directory. It is supposedly simple enough to understand.

Note that this requires accessing the trainerdata sets on this repository,
because your exploitation code will require to sideload them.

Usage of multiple threads for parsing the same record will not work, but you
can use them for parsing multiple records in parallel, each in their own
thread/coroutine.

### Format

Each record is one line long, terminated with a newline, with fields separated
with spaces.

### Fields:

- **0**: the trainerdata version used
- **1**: the chosen class
- **2**: the chosen level
- **3 and later**: Trees order is the same as the website. trees are read
                   sequentially, in json order.
    - Odd indexes: skilltree level
    - Even indexes: concatenation of each skill powerpoints on 1 digit

