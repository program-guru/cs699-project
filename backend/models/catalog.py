from enum import StrEnum


class College(StrEnum):
    IITB = "IIT Bombay"
    IITD = "IIT Delhi"
    IITH = "IIT Hyderabad"
    IITK = "IIT Kharagpur"


class Department(StrEnum):
    CSE = "Computer Science and Engineering"
    EE = "Electrical Engineering"
