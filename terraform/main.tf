provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "tic_tac_toe_sg" {
  name        = "tic_tac_toe_sg"
  description = "Allow SSH, HTTP, Jenkins (8080), sonarqube(9000)"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tic-tac-toe-sg"
  }
}

resource "aws_instance" "Tic-Tac-Toe" {
  ami = var.ami_id
  instance_type = var.instance_type
  vpc_security_group_ids = [ aws_security_group.tic_tac_toe_sg.id ]
  key_name = var.key_name

  tags = {
    Name = "Tic-Tac_Toe_game"
  }
}
