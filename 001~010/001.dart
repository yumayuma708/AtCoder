import 'dart:io';

void main() {
  String? input = stdin.readLineSync();

  if (input != null) {
    int N = int.parse(input);

    int area = N * N;

    print(area);
  }
}
