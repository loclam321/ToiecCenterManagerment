-- Seed script for weekly lesson release logic
-- Adjust IDs or remove rows if they already exist in your environment.

START TRANSACTION;

-- 1. Core course definition



-- 6. Lesson theo tuần, unlock bằng ls_date
DELETE FROM lesson WHERE ls_id BETWEEN 7001 AND 7008;
INSERT INTO lesson (
    ls_id, lp_id, part_id, ls_name, ls_link, ls_date
) VALUES
    (7001, 1, 1, 'Tuần 1 - Làm quen Part 1', '/video/f1.mp4', DATE('2025-10-13')),
    (7002, 1, 2, 'Tuần 2 - Nghe phản xạ Part 2', '/video/5734765-hd_1920_1080_30fps.mp4', DATE('2025-10-20')),
    (7003, 1, 3, 'Tuần 3 - Hội thoại Part 3', '/video/PL_TOEIC_intro.mp4', DATE('2025-10-27')),
    (7004, 1, 4, 'Tuần 4 - Bài nói Part 4', '/video/f1.mp4', DATE('2025-11-03')),
    (7005, 1, 5, 'Tuần 5 - Ngữ pháp Part 5', '/video/5734765-hd_1920_1080_30fps.mp4', DATE('2025-11-10')),
    (7006, 1, 6, 'Tuần 6 - Điền đoạn Part 6', '/video/PL_TOEIC_intro.mp4', DATE('2025-11-17')),
    (7007, 1, 7, 'Tuần 7 - Đọc hiểu đơn Part 7', '/video/f1.mp4', DATE('2025-11-24')),
    (7008, 1, 8, 'Tuần 8 - Đọc hiểu đôi Part 7', '/video/5734765-hd_1920_1080_30fps.mp4', DATE('2025-12-01'));

-- 7. Item & Choice mẫu cho từng lesson (2 câu hỏi/lesson)
DELETE FROM choices WHERE choice_id BETWEEN 95001 AND 95016;
DELETE FROM items WHERE item_id BETWEEN 85001 AND 85016;

INSERT INTO items (
    item_id, part_id, test_id, item_group_key, item_stimulus_text,
    item_question_text, item_image_path, item_audio_path, item_order_in_part
) VALUES
    (85001, 1, NULL, 'lesson-7001', 'A man is standing next to a whiteboard.', 'What is the man doing?', '/assets1/f2.png', '/audio-for-test/Test 01-Part 1-01.mp3', 1),
    (85002, 1, NULL, 'lesson-7001', 'A woman is holding a bouquet.', 'What is the woman holding?', '/assets1/f3.png', '/audio-for-test/Test 01-Part 1-02.mp3', 2),

    (85003, 2, NULL, 'lesson-7002', NULL, 'Where is the nearest bank?', NULL, '/audio-for-test/Test 01-Part 1-03.mp3', 1),
    (85004, 2, NULL, 'lesson-7002', NULL, 'What time does the meeting start?', NULL, '/audio-for-test/Test 01-Part 1-04.mp3', 2),

    (85005, 3, NULL, 'lesson-7003', 'Conversation between two coworkers.', 'What are they discussing?', NULL, '/audio-for-test/Test 01-Part 1-05.mp3', 1),
    (85006, 3, NULL, 'lesson-7003', 'Conversation in a cafe.', 'What does the woman order?', NULL, '/audio-for-test/Test 01-Part 1-06.mp3', 2),

    (85007, 4, NULL, 'lesson-7004', 'Talk about a company outing.', 'When will the outing take place?', NULL, '/audio-for-test/Test 01-Part 1-01.mp3', 1),
    (85008, 4, NULL, 'lesson-7004', 'Talk about new office rules.', 'What must employees do before entering?', NULL, '/audio-for-test/Test 01-Part 1-02.mp3', 2),

    (85009, 5, NULL, 'lesson-7005', NULL, 'She _____ the report yesterday.', NULL, NULL, 1),
    (85010, 5, NULL, 'lesson-7005', NULL, 'Please make sure the doors ____ locked.', NULL, NULL, 2),

    (85011, 6, NULL, 'lesson-7006', 'To: Staff
From: HR', 'What is the purpose of the memo?', NULL, NULL, 1),
    (85012, 6, NULL, 'lesson-7006', 'Dear Customers,
We appreciate your support.', 'What is being announced?', NULL, NULL, 2),

    (85013, 7, NULL, 'lesson-7007', 'Article about city transportation.', 'According to the article, when will the new line open?', NULL, NULL, 1),
    (85014, 7, NULL, 'lesson-7007', 'Advertisement for a sale.', 'What discount is offered?', NULL, NULL, 2),

    (85015, 7, NULL, 'lesson-7008', 'Email + Schedule', 'Why is the meeting moved?', NULL, NULL, 1),
    (85016, 7, NULL, 'lesson-7008', 'Memo + Flyer', 'Where will the event take place?', NULL, NULL, 2);

INSERT INTO choices (
    choice_id, item_id, choice_label, choice_content, choice_is_correct
) VALUES
    (95001, 85001, 'A', 'He is erasing the board.', 0),
    (95002, 85001, 'B', 'He is drawing a diagram.', 1),
    (95003, 85001, 'C', 'He is sitting down.', 0),
    (95004, 85001, 'D', 'He is reading a book.', 0),

    (95005, 85002, 'A', 'A bouquet of flowers.', 1),
    (95006, 85002, 'B', 'A stack of books.', 0),
    (95007, 85002, 'C', 'A laptop computer.', 0),
    (95008, 85002, 'D', 'A shopping bag.', 0),

    (95009, 85003, 'A', 'On the next corner.', 1),
    (95010, 85003, 'B', 'It opens at nine.', 0),
    (95011, 85003, 'C', 'Use the elevator.', 0),
    (95012, 85003, 'D', 'I left it there.', 0),

    (95013, 85004, 'A', 'At 10 a.m.', 1),
    (95014, 85004, 'B', 'In Conference Room B.', 0),
    (95015, 85004, 'C', 'Twice a month.', 0),
    (95016, 85004, 'D', 'Because of traffic.', 0),

    (95017, 85005, 'A', 'Planning a marketing event.', 0),
    (95018, 85005, 'B', 'Launching a new product.', 1),
    (95019, 85005, 'C', 'Hiring a new employee.', 0),
    (95020, 85005, 'D', 'Scheduling maintenance.', 0),

    (95021, 85006, 'A', 'Tea and a sandwich.', 0),
    (95022, 85006, 'B', 'A latte and a muffin.', 1),
    (95023, 85006, 'C', 'Black coffee only.', 0),
    (95024, 85006, 'D', 'The daily special.', 0),

    (95025, 85007, 'A', 'This Saturday.', 0),
    (95026, 85007, 'B', 'Next Wednesday.', 1),
    (95027, 85007, 'C', 'In two weeks.', 0),
    (95028, 85007, 'D', 'Today at noon.', 0),

    (95029, 85008, 'A', 'Scan their ID card.', 0),
    (95030, 85008, 'B', 'Sign the visitor log.', 0),
    (95031, 85008, 'C', 'Sanitize their hands.', 1),
    (95032, 85008, 'D', 'Turn off their phones.', 0),

    (95033, 85009, 'A', 'Complete', 0),
    (95034, 85009, 'B', 'Completes', 0),
    (95035, 85009, 'C', 'Completed', 1),
    (95036, 85009, 'D', 'Completing', 0),

    (95037, 85010, 'A', 'are', 1),
    (95038, 85010, 'B', 'is', 0),
    (95039, 85010, 'C', 'been', 0),
    (95040, 85010, 'D', 'being', 0),

    (95041, 85011, 'A', 'Announce a staff picnic.', 0),
    (95042, 85011, 'B', 'Update overtime policy.', 0),
    (95043, 85011, 'C', 'Request training feedback.', 1),
    (95044, 85011, 'D', 'Inform about renovations.', 0),

    (95045, 85012, 'A', 'A limited-time discount.', 1),
    (95046, 85012, 'B', 'A change of address.', 0),
    (95047, 85012, 'C', 'New store hours.', 0),
    (95048, 85012, 'D', 'A product recall.', 0),

    (95049, 85013, 'A', 'Next Monday.', 0),
    (95050, 85013, 'B', 'On July 1st.', 1),
    (95051, 85013, 'C', 'After construction ends.', 0),
    (95052, 85013, 'D', 'At the end of the year.', 0),

    (95053, 85014, 'A', '10 percent.', 0),
    (95054, 85014, 'B', '15 percent.', 1),
    (95055, 85014, 'C', '20 percent.', 0),
    (95056, 85014, 'D', 'Buy one get one.', 0),

    (95057, 85015, 'A', 'The speaker is ill.', 0),
    (95058, 85015, 'B', 'The room is unavailable.', 1),
    (95059, 85015, 'C', 'Client travel issues.', 0),
    (95060, 85015, 'D', 'Equipment failure.', 0),

    (95061, 85016, 'A', 'At the downtown hall.', 1),
    (95062, 85016, 'B', 'In the cafeteria.', 0),
    (95063, 85016, 'C', 'At the main office.', 0),
    (95064, 85016, 'D', 'In the conference wing.', 0);

COMMIT;
