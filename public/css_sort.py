def sort_css_classes(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    class_blocks = {}
    current_class = None
    current_block = []

    for line in lines:
        if line.startswith('.'):
            if current_class:
                class_blocks[current_class] = current_block
            current_class = line.strip()
            current_block = [line]
        else:
            current_block.append(line)

    if current_class:
        class_blocks[current_class] = current_block

    sorted_classes = sorted(class_blocks.keys())

    with open(file_path, 'w') as file:
        for class_name in sorted_classes:
            file.writelines(class_blocks[class_name])

if __name__ == "__main__":
    sort_css_classes('styles.css')