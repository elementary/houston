workflow "New workflow" {
  on = "push"
  resolves = ["Javascript Lint"]
}

action "Javascript Lint" {
  uses = "actions/npm@6309cd9"
  runs = "run lint"
}
