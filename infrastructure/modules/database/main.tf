resource "aws_dynamodb_table" "cats" {
  name         = "${var.project}-sightings-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "town"
    type = "S"
  }
  attribute {
    name = "uploadedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "TownIndex"
    hash_key        = "town"
    range_key       = "uploadedAt"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }

  tags = {
    Name = "${var.project}-sightings-${var.environment}"
  }
}
